import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateEmbedding } from '@/lib/gemini';

interface SearchResult {
  id: string;
  project_id: string;
  developer_name: string;
  change_description: string | null;
  module_name: string;
  understanding_text: string;
  confidence_score: number | null;
  created_at: string;
  similarity: number;
  source?: 'semantic' | 'text' | 'hld' | 'lld';
}

// POST: Combined search (semantic + text + HLD/LLD)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, project_id } = body;

    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    if (!project_id || !project_id.trim()) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    console.log(`Searching for: "${query}" in project ${project_id}`);

    const searchTerm = query.trim();
    const allResults: SearchResult[] = [];
    const seenIds = new Set<string>();

    // 1. Text search in HLD/LLD documents
    try {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id, name, hld_text, lld_text, created_at')
        .eq('id', project_id)
        .single();

      if (!projectError && projectData) {
        // Check HLD
        if (projectData.hld_text && projectData.hld_text.toLowerCase().includes(searchTerm.toLowerCase())) {
          allResults.push({
            id: `hld-${projectData.id}`,
            project_id: projectData.id,
            developer_name: 'Project Documentation',
            change_description: null,
            module_name: 'High-Level Design',
            understanding_text: projectData.hld_text.substring(0, 500) + (projectData.hld_text.length > 500 ? '...' : ''),
            confidence_score: null,
            created_at: projectData.created_at || new Date().toISOString(),
            similarity: 95,
            source: 'hld',
          });
        }

        // Check LLD
        if (projectData.lld_text && projectData.lld_text.toLowerCase().includes(searchTerm.toLowerCase())) {
          allResults.push({
            id: `lld-${projectData.id}`,
            project_id: projectData.id,
            developer_name: 'Project Documentation',
            change_description: null,
            module_name: 'Low-Level Design',
            understanding_text: projectData.lld_text.substring(0, 500) + (projectData.lld_text.length > 500 ? '...' : ''),
            confidence_score: null,
            created_at: projectData.created_at || new Date().toISOString(),
            similarity: 95,
            source: 'lld',
          });
        }
      }
    } catch (error) {
      console.error('HLD/LLD search error:', error);
    }

    // 2. Text search in understandings (ILIKE)
    try {
      const { data: textResults, error: textError } = await supabase
        .from('understandings')
        .select('*')
        .eq('project_id', project_id)
        .or(`understanding_text.ilike.%${searchTerm}%,module_name.ilike.%${searchTerm}%,developer_name.ilike.%${searchTerm}%,change_description.ilike.%${searchTerm}%`);

      if (!textError && textResults) {
        textResults.forEach((result: any) => {
          if (!seenIds.has(result.id)) {
            seenIds.add(result.id);
            allResults.push({
              ...result,
              similarity: 90,
              source: 'text',
            });
          }
        });
      }
    } catch (error) {
      console.error('Text search error:', error);
    }

    // 3. Semantic search using embeddings
    try {
      const queryEmbedding = await generateEmbedding(searchTerm);
      console.log('Generated query embedding with', queryEmbedding.length, 'dimensions');

      const { data: semanticResults, error: semanticError } = await supabase
        .from('understandings')
        .select('*')
        .eq('project_id', project_id)
        .not('embedding', 'is', null);

      if (!semanticError && semanticResults) {
        semanticResults.forEach((result: any) => {
          if (!seenIds.has(result.id)) {
            // Parse embedding
            let embedding = result.embedding;
            if (typeof embedding === 'string') {
              try {
                const embeddingStr = embedding.trim();
                const jsonStr = embeddingStr.startsWith('[') ? embeddingStr : `[${embeddingStr}]`;
                embedding = JSON.parse(jsonStr);
              } catch (e) {
                return;
              }
            }

            if (Array.isArray(embedding) && embedding.length === queryEmbedding.length) {
              // Calculate cosine similarity
              let dotProduct = 0;
              let magA = 0;
              let magB = 0;
              for (let i = 0; i < embedding.length; i++) {
                dotProduct += embedding[i] * queryEmbedding[i];
                magA += embedding[i] * embedding[i];
                magB += queryEmbedding[i] * queryEmbedding[i];
              }
              const similarity = dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));

              if (similarity >= 0.3) {
                seenIds.add(result.id);
                allResults.push({
                  ...result,
                  similarity: Math.round(similarity * 1000) / 10,
                  source: 'semantic',
                });
              }
            }
          }
        });
      }
    } catch (error) {
      console.error('Semantic search error:', error);
      // Continue without semantic search
    }

    // Sort by similarity and limit to top 10
    const sortedResults = allResults
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10);

    console.log(`Found ${sortedResults.length} total results`);

    return NextResponse.json({
      results: sortedResults,
      total: sortedResults.length,
    });
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
