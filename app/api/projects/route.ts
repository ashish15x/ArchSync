import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ProjectInsert } from '@/lib/db-types';

// GET: Fetch all projects
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, hld_text, lld_text } = body as ProjectInsert;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    // Insert project into database
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: name.trim(),
        hld_text: hld_text || null,
        lld_text: lld_text || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
