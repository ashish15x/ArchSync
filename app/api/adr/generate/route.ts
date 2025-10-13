import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { clusterUnderstandings, calculateConsensus } from '@/lib/clustering';
import { Understanding } from '@/lib/db-types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id, module_name } = body;

    if (!project_id || !module_name) {
      return NextResponse.json(
        { error: 'project_id and module_name are required' },
        { status: 400 }
      );
    }

    console.log(`Generating ADR for module: ${module_name}`);

    // Fetch project info
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('name')
      .eq('id', project_id)
      .single();

    if (projectError) {
      console.error('Error fetching project:', projectError);
      return NextResponse.json(
        { error: 'Failed to fetch project' },
        { status: 500 }
      );
    }

    // Fetch all understandings for the module
    const { data: understandingsData, error: understandingsError } = await supabase
      .from('understandings')
      .select('*')
      .eq('project_id', project_id)
      .eq('module_name', module_name)
      .not('embedding', 'is', null);

    if (understandingsError) {
      console.error('Error fetching understandings:', understandingsError);
      return NextResponse.json(
        { error: 'Failed to fetch understandings' },
        { status: 500 }
      );
    }

    let understandings = understandingsData as Understanding[];

    if (understandings.length === 0) {
      return NextResponse.json(
        { error: 'No understandings found for this module' },
        { status: 400 }
      );
    }

    // Parse embeddings
    understandings = understandings.map(u => {
      if (u.embedding && typeof u.embedding === 'string') {
        try {
          const embeddingStr = (u.embedding as string).trim();
          const jsonStr = embeddingStr.startsWith('[') ? embeddingStr : `[${embeddingStr}]`;
          u.embedding = JSON.parse(jsonStr) as number[];
        } catch (e) {
          u.embedding = null;
        }
      }
      return u;
    });

    // Perform clustering
    const clusters = clusterUnderstandings(understandings);
    const consensusPercentage = calculateConsensus(clusters);

    // Get next ADR number
    const { data: existingADRs, error: adrCountError } = await supabase
      .from('adrs')
      .select('adr_number')
      .eq('project_id', project_id)
      .order('adr_number', { ascending: false })
      .limit(1);

    const nextADRNumber = existingADRs && existingADRs.length > 0 
      ? existingADRs[0].adr_number + 1 
      : 1;

    // Build cluster descriptions
    const clusterDescriptions = clusters.map((cluster, index) => {
      const developerList = cluster.understandings.map(u => 
        `${u.developer_name} (confidence: ${u.confidence_score || 'N/A'}/5)`
      ).join(', ');

      return `
=== ${index === 0 ? 'Majority Understanding' : `Alternative ${index}`} (${cluster.percentage.toFixed(1)}%) ===
${cluster.representative_text}
Team members: ${developerList}
`;
    }).join('\n');

    // Determine status
    let status = 'Under Discussion';
    if (consensusPercentage > 70) status = 'Accepted';
    else if (consensusPercentage >= 50) status = 'Proposed';

    // Build prompt for Gemini
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const prompt = `Generate an Architecture Decision Record (ADR) in professional format.

Project: ${projectData.name}
Module: ${module_name}
Team Consensus: ${consensusPercentage.toFixed(1)}%
Total Contributors: ${understandings.length}

${clusterDescriptions}

Generate ADR in this EXACT markdown format:

# ADR-${String(nextADRNumber).padStart(3, '0')}: [Descriptive Title for ${module_name} Decision]

**Date:** ${currentDate}
**Status:** ${status}
**Team Consensus:** ${consensusPercentage.toFixed(1)}%

## Context

[Describe the technical context and why this architectural decision matters. Use information from understandings.]

## Decision

[Clearly state what approach was chosen and WHY. Be specific and technical. Use team's actual reasoning.]

## Rationale

[Explain the reasoning behind this decision. Include technical considerations mentioned by team members.]

## Consequences

### Positive
- [Benefit 1 based on team understanding]
- [Benefit 2]
- [Benefit 3]

### Negative  
- [Trade-off 1 if any mentioned]
- [Trade-off 2]

## Alternatives Considered

[If multiple approaches exist, describe alternatives and why they weren't chosen]

## Implementation Notes

[Practical implementation details from team understandings]

## Team Alignment

- **Consensus Level:** ${consensusPercentage.toFixed(1)}%
- **Contributors:** ${understandings.map(u => `${u.developer_name} (${u.confidence_score || 'N/A'}/5)`).join(', ')}
- **Date Established:** ${currentDate}

${consensusPercentage < 70 ? '⚠️ **Note:** Moderate team alignment. Recommend follow-up discussion.' : ''}

Use technical language and be specific. This is a professional document. Return ONLY the markdown, no other text.`;

    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();

    console.log('Generated ADR content');

    // Extract title from content
    const titleMatch = content.match(/# ADR-\d+: (.+)/);
    const title = titleMatch ? titleMatch[1].trim() : `${module_name} Architecture Decision`;

    // Save to database
    const { data: savedADR, error: saveError } = await supabase
      .from('adrs')
      .insert({
        project_id,
        module_name,
        adr_number: nextADRNumber,
        title,
        content,
        status,
        consensus_percentage: Math.round(consensusPercentage),
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving ADR:', saveError);
      // Continue anyway, return the content
    }

    return NextResponse.json({
      content,
      adr_number: nextADRNumber,
      title,
      status,
      consensus_percentage: consensusPercentage,
      adr_id: savedADR?.id,
      success: true,
    });

  } catch (error) {
    console.error('Error generating ADR:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate ADR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
