import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface ClusterData {
  id: number;
  size: number;
  percentage: number;
  representative_text: string;
  developers: Array<{
    name: string;
    confidence_score: number | null;
  }>;
}

interface ConflictAnalysis {
  root_cause: string;
  recommendation: string;
  recommended_approach: string;
  reasoning: string;
  risks: {
    if_unresolved: string;
    severity: 'High' | 'Medium' | 'Low';
  };
  action_items: string[];
  technical_considerations: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id, module_name, clusters } = body as {
      project_id: string;
      module_name: string;
      clusters: ClusterData[];
    };

    if (!project_id || !module_name || !clusters || clusters.length < 2) {
      return NextResponse.json(
        { error: 'Invalid request. Need project_id, module_name, and at least 2 clusters.' },
        { status: 400 }
      );
    }

    console.log(`Analyzing conflict for module: ${module_name}`);

    // Fetch project context
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('name, hld_text, lld_text')
      .eq('id', project_id)
      .single();

    if (projectError) {
      console.error('Error fetching project:', projectError);
      return NextResponse.json(
        { error: 'Failed to fetch project context' },
        { status: 500 }
      );
    }

    // Build context excerpts (limit to relevant parts)
    const hldContext = projectData.hld_text 
      ? projectData.hld_text.substring(0, 1000) + (projectData.hld_text.length > 1000 ? '...' : '')
      : 'No HLD provided';
    
    const lldContext = projectData.lld_text
      ? projectData.lld_text.substring(0, 1000) + (projectData.lld_text.length > 1000 ? '...' : '')
      : 'No LLD provided';

    // Build cluster descriptions
    const clusterDescriptions = clusters.slice(0, 3).map((cluster, index) => {
      const avgConfidence = cluster.developers.reduce((sum, dev) => 
        sum + (dev.confidence_score || 3), 0) / cluster.developers.length;
      
      return `
=== Approach ${index + 1} (${cluster.percentage.toFixed(1)}% of team) ===
${cluster.representative_text}
Supported by: ${cluster.developers.map(d => d.name).join(', ')}
Average Confidence: ${avgConfidence.toFixed(1)}/5
`;
    }).join('\n');

    // Build prompt for Gemini
    const prompt = `You are an expert software architect analyzing team understanding conflicts.

Project: ${projectData.name}
Context from HLD: ${hldContext}
Context from LLD: ${lldContext}
Module: ${module_name}

The team has divergent understandings about this module:

${clusterDescriptions}

Provide analysis in this EXACT JSON format (no markdown, just pure JSON):
{
  "root_cause": "Brief explanation of why these conflicts exist",
  "recommendation": "Which approach is better, or suggest a hybrid. Be specific.",
  "recommended_approach": "Approach 1" or "Approach 2" or "Hybrid",
  "reasoning": "Technical reasoning for recommendation",
  "risks": {
    "if_unresolved": "What could go wrong if team doesn't align",
    "severity": "High" or "Medium" or "Low"
  },
  "action_items": [
    "Specific action 1",
    "Specific action 2",
    "Specific action 3"
  ],
  "technical_considerations": [
    "Point 1",
    "Point 2"
  ]
}

Be technical, specific, and actionable. Return ONLY the JSON, no other text.`;

    // Call Gemini API (using gemini-pro which is stable and available)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('Gemini response:', text);

    // Parse JSON response
    let analysis: ConflictAnalysis;
    try {
      // Remove markdown code blocks if present
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      return NextResponse.json(
        { 
          error: 'AI analysis failed to return valid format',
          details: 'The AI response could not be parsed. Please try again.'
        },
        { status: 500 }
      );
    }

    // Store analysis in database
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('conflict_analyses')
      .insert({
        project_id,
        module_name,
        analysis: analysis as ConflictAnalysis,
        consensus_percentage: Math.round(clusters[0].percentage),
        severity: analysis.risks.severity,
        resolved: false,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving analysis:', saveError);
      // Continue anyway, return the analysis
    }

    return NextResponse.json({
      analysis,
      analysis_id: savedAnalysis?.id,
      success: true,
    });

  } catch (error) {
    console.error('Error analyzing conflict:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze conflict',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
