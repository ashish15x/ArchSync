import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { clusterUnderstandings, calculateConsensus } from '@/lib/clustering';
import { Understanding } from '@/lib/db-types';

// GET: Analyze consensus for a module
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('project_id');
    const moduleName = searchParams.get('module_name');

    if (!projectId) {
      return NextResponse.json(
        { error: 'project_id query parameter is required' },
        { status: 400 }
      );
    }

    if (!moduleName) {
      return NextResponse.json(
        { error: 'module_name query parameter is required' },
        { status: 400 }
      );
    }

    // Fetch all understandings for this module with embeddings
    const { data, error } = await supabase
      .from('understandings')
      .select('*')
      .eq('project_id', projectId)
      .eq('module_name', moduleName)
      .not('embedding', 'is', null);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch understandings' },
        { status: 500 }
      );
    }

    let understandings = data as Understanding[];

    console.log(`Found ${understandings.length} understandings for module: ${moduleName}`);

    // Check if we have enough understandings
    if (understandings.length < 2) {
      return NextResponse.json({
        message: 'Need at least 2 understandings to analyze consensus',
        total_understandings: understandings.length,
        consensus_percentage: 0,
        clusters: [],
      });
    }

    // Parse embeddings from PostgreSQL vector format (string) to arrays
    understandings = understandings.map(u => {
      if (u.embedding && typeof u.embedding === 'string') {
        try {
          // PostgreSQL vector format: [1,2,3] or "[1,2,3]"
          const embeddingStr = (u.embedding as string).trim();
          const jsonStr = embeddingStr.startsWith('[') ? embeddingStr : `[${embeddingStr}]`;
          u.embedding = JSON.parse(jsonStr) as number[];
        } catch (e) {
          console.error(`Failed to parse embedding for understanding ${u.id}:`, e);
          u.embedding = null;
        }
      }
      return u;
    });

    // Validate embeddings exist and are arrays
    const validUnderstandings = understandings.filter(u => {
      if (!u.embedding) {
        console.warn(`Understanding ${u.id} has no embedding`);
        return false;
      }
      if (!Array.isArray(u.embedding)) {
        console.warn(`Understanding ${u.id} embedding is not an array:`, typeof u.embedding);
        return false;
      }
      if (u.embedding.length === 0) {
        console.warn(`Understanding ${u.id} has empty embedding`);
        return false;
      }
      return true;
    });

    console.log(`${validUnderstandings.length} valid understandings with embeddings`);

    if (validUnderstandings.length < 2) {
      return NextResponse.json({
        message: `Need at least 2 understandings with valid embeddings. Found ${validUnderstandings.length} valid out of ${understandings.length} total.`,
        total_understandings: validUnderstandings.length,
        consensus_percentage: 0,
        clusters: [],
      });
    }

    // Perform clustering
    const clusters = clusterUnderstandings(validUnderstandings);
    
    // Calculate consensus percentage
    const consensusPercentage = calculateConsensus(clusters);

    return NextResponse.json({
      consensus_percentage: Math.round(consensusPercentage * 10) / 10, // Round to 1 decimal
      clusters: clusters.map(cluster => ({
        id: cluster.id,
        size: cluster.size,
        percentage: Math.round(cluster.percentage * 10) / 10,
        representative_text: cluster.representative_text,
        developers: cluster.understandings.map(u => ({
          name: u.developer_name,
          understanding_id: u.id,
          confidence_score: u.confidence_score,
        })),
      })),
      total_understandings: understandings.length,
      module_name: moduleName,
    });
  } catch (error) {
    console.error('Error analyzing consensus:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze consensus',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
