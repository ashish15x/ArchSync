import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    const { data, error } = await supabase
      .from('dev_reports')
      .select('*')
      .eq('project_id', project_id)
      .order('generated_at', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in reports API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
