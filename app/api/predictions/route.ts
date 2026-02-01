import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Understanding } from '@/lib/db-types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const project_id = searchParams.get('project_id');

    if (!project_id) {
      return NextResponse.json(
        { error: 'project_id is required' },
        { status: 400 }
      );
    }

    console.log(`Generating predictions for project: ${project_id}`);

    // Fetch all understandings with timestamps
    const { data: understandingsData, error: understandingsError } = await supabase
      .from('understandings')
      .select('*')
      .eq('project_id', project_id)
      .order('created_at', { ascending: true });

    if (understandingsError) {
      console.error('Error fetching understandings:', understandingsError);
      return NextResponse.json(
        { error: 'Failed to fetch understandings' },
        { status: 500 }
      );
    }

    let understandings = understandingsData as Understanding[];

    if (understandings.length < 5) {
      return NextResponse.json({
        predictions: [],
        consensus_forecast: [],
        at_risk_developers: [],
        stable_modules: [],
        message: 'Not enough data for predictions (need at least 5 understandings)',
      });
    }

    // Parse embeddings
    understandings = understandings.map(u => {
      if (u.embedding && typeof u.embedding === 'string') {
        try {
          const embeddingStr = (u.embedding as string).trim();
          const jsonStr = embeddingStr.startsWith('[') ? embeddingStr : `[${embeddingStr}]`;
          u.embedding = JSON.parse(jsonStr) as number[];
        } catch {
          u.embedding = null;
        }
      }
      return u;
    });

    // Group by developer and module
    const developerModuleMap = new Map<string, Map<string, Understanding[]>>();
    understandings.forEach(u => {
      if (!developerModuleMap.has(u.developer_name)) {
        developerModuleMap.set(u.developer_name, new Map());
      }
      const moduleMap = developerModuleMap.get(u.developer_name)!;
      if (!moduleMap.has(u.module_name)) {
        moduleMap.set(u.module_name, []);
      }
      moduleMap.get(u.module_name)!.push(u);
    });

    // Calculate recent vs historical patterns
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentUnderstandings = understandings.filter(u => 
      new Date(u.created_at) >= oneWeekAgo
    );

    // Analyze developer alignment trends
    const developerAnalysis: {
      developer: string;
      module: string;
      recent_count: number;
      total_count: number;
      similarity_trend: number;
      recent_understanding: string;
    }[] = [];
    
    developerModuleMap.forEach((moduleMap, developer) => {
      moduleMap.forEach((understandingsList, module) => {
        if (understandingsList.length >= 2) {
          const recent = understandingsList.filter(u => 
            new Date(u.created_at) >= oneWeekAgo
          );
          
          if (recent.length > 0) {
            // Calculate similarity to team average (simplified)
            const teamUnderstandings = understandings.filter(u => 
              u.module_name === module && u.developer_name !== developer && u.embedding
            );
            
            if (teamUnderstandings.length > 0) {
              // Simple similarity calculation
              const recentEmbedding = recent[recent.length - 1].embedding as number[];
              const oldEmbedding = understandingsList[0].embedding as number[];
              
              if (recentEmbedding && oldEmbedding) {
                const similarity = calculateCosineSimilarity(recentEmbedding, oldEmbedding);
                
                developerAnalysis.push({
                  developer,
                  module,
                  recent_count: recent.length,
                  total_count: understandingsList.length,
                  similarity_trend: similarity,
                  recent_understanding: recent[recent.length - 1].understanding_text.substring(0, 100),
                });
              }
            }
          }
        }
      });
    });

    // Build prompt for Gemini (optimized - shorter prompt)
    const developerSummary = developerAnalysis.slice(0, 3).map(d => 
      `${d.developer} on ${d.module}: ${d.recent_count} recent, ${(d.similarity_trend * 100).toFixed(0)}% similarity`
    ).join('\n');

    const moduleGroups = new Map<string, Understanding[]>();
    understandings.forEach(u => {
      if (!moduleGroups.has(u.module_name)) {
        moduleGroups.set(u.module_name, []);
      }
      moduleGroups.get(u.module_name)!.push(u);
    });

    const moduleSummary = Array.from(moduleGroups.entries()).slice(0, 3).map(([module, list]) => 
      `${module}: ${list.length} total, ${list.filter(u => new Date(u.created_at) >= oneWeekAgo).length} recent`
    ).join('\n');

    const prompt = `Analyze this dev team data and predict conflicts.

Total: ${understandings.length} understandings, ${recentUnderstandings.length} recent
Modules: ${moduleSummary}
Developers: ${developerSummary}

IMPORTANT: Use actual developer names from the data above. Never use placeholders like "Team Member A" or "Developer X".

Keep descriptions simple and direct. Use plain language.

Return ONLY valid JSON:
{
  "predictions": [
    {
      "type": "developer_drift",
      "severity": "High",
      "confidence": 85,
      "module": "Payment Processing",
      "developer": "Sarah Johnson",
      "description": "Sarah's recent ideas differ from the team's approach",
      "current_similarity": 62,
      "trend": "declining",
      "predicted_conflict_in": "2 weeks",
      "recommendation": "Have a quick sync meeting to align on the approach"
    }
  ],
  "consensus_forecast": [
    {
      "module": "Authentication",
      "current_consensus": 75,
      "predicted_1week": 70,
      "predicted_2week": 65,
      "trend": "declining",
      "reason": "Team members have different opinions on this"
    }
  ],
  "at_risk_developers": [
    {
      "name": "Sarah Johnson",
      "modules": ["Payment Processing"],
      "alignment": 62,
      "trend": "declining",
      "recommendation": "Pair with another developer to share knowledge"
    }
  ],
  "stable_modules": ["User Management", "Reporting"]
}

Rules:
- Use REAL developer names from the data
- Keep language simple and direct
- Be realistic with predictions`;

    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let aiResponse = response.text();

    // Clean up response (remove markdown code blocks if present)
    aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let predictions;
    try {
      predictions = JSON.parse(aiResponse);
    } catch {
      console.error('Failed to parse AI response:', aiResponse);
      return NextResponse.json({
        predictions: [],
        consensus_forecast: [],
        at_risk_developers: [],
        stable_modules: [],
        error: 'Failed to parse predictions',
      });
    }

    // Save high-severity predictions to database
    if (predictions.predictions && predictions.predictions.length > 0) {
      const highSeverityPredictions = predictions.predictions.filter(
        (p: { severity: string }) => p.severity === 'High'
      );

      for (const pred of highSeverityPredictions) {
        await supabase.from('predictions').insert({
          project_id,
          prediction_type: pred.type,
          severity: pred.severity,
          confidence: pred.confidence,
          module_name: pred.module,
          developer_name: pred.developer,
          description: pred.description,
        });
      }
    }

    console.log('Predictions generated successfully');

    return NextResponse.json(predictions);

  } catch (error) {
    console.error('Error generating predictions:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate predictions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate cosine similarity
function calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
  if (!vec1 || !vec2 || vec1.length !== vec2.length) return 0;
  
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }
  
  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);
  
  if (mag1 === 0 || mag2 === 0) return 0;
  
  return dotProduct / (mag1 * mag2);
}
