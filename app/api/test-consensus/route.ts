import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Test endpoint to check understandings data
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('understandings')
      .select('id, module_name, developer_name, embedding')
      .limit(5);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      count: data?.length || 0,
      sample: data?.map(u => ({
        id: u.id,
        module_name: u.module_name,
        developer_name: u.developer_name,
        has_embedding: !!u.embedding,
        embedding_type: typeof u.embedding,
        embedding_is_array: Array.isArray(u.embedding),
        embedding_length: Array.isArray(u.embedding) ? u.embedding.length : 0,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
