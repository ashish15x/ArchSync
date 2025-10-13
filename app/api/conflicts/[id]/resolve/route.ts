import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('conflict_analyses')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', params.id);

    if (error) {
      console.error('Error resolving conflict:', error);
      return NextResponse.json(
        { error: 'Failed to mark conflict as resolved' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error resolving conflict:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
