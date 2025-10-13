import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateEmbedding } from '@/lib/gemini';
import { UnderstandingInsert } from '@/lib/db-types';

// POST: Create new understanding with embedding
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      project_id,
      developer_name,
      change_description,
      module_name,
      understanding_text,
      confidence_score,
    } = body as UnderstandingInsert & { confidence_score?: number };

    // Validate required fields
    if (!project_id || !project_id.trim()) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }
    if (!developer_name || !developer_name.trim()) {
      return NextResponse.json(
        { error: 'Developer name is required' },
        { status: 400 }
      );
    }
    if (!module_name || !module_name.trim()) {
      return NextResponse.json(
        { error: 'Module name is required' },
        { status: 400 }
      );
    }
    if (!understanding_text || !understanding_text.trim()) {
      return NextResponse.json(
        { error: 'Understanding text is required' },
        { status: 400 }
      );
    }

    // Validate confidence score if provided
    if (confidence_score !== undefined && (confidence_score < 1 || confidence_score > 5)) {
      return NextResponse.json(
        { error: 'Confidence score must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Generate embedding using Gemini
    let embedding: number[] | null = null;
    try {
      embedding = await generateEmbedding(understanding_text.trim());
      console.log('Generated embedding with', embedding.length, 'dimensions');
    } catch (embeddingError) {
      console.error('Embedding generation error:', embeddingError);
      return NextResponse.json(
        { 
          error: 'Failed to generate embedding. Please try again or contact support if the issue persists.',
          details: embeddingError instanceof Error ? embeddingError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    // Insert understanding into database
    // Format embedding as PostgreSQL vector string: [1,2,3]
    const embeddingString = `[${embedding.join(',')}]`;
    
    const { data, error } = await supabase
      .from('understandings')
      .insert({
        project_id: project_id.trim(),
        developer_name: developer_name.trim(),
        change_description: change_description?.trim() || null,
        module_name: module_name.trim(),
        understanding_text: understanding_text.trim(),
        confidence_score: confidence_score || null,
        embedding: embeddingString,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save understanding to database' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating understanding:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET: Fetch understandings by project_id
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json(
        { error: 'project_id query parameter is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('understandings')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch understandings' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching understandings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
