import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateEmbedding } from '@/lib/gemini';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, project_id, conversation_history = [] } = body;

    if (!message || !project_id) {
      return NextResponse.json(
        { error: 'message and project_id are required' },
        { status: 400 }
      );
    }

    console.log(`Chat query: "${message}" for project: ${project_id}`);

    // 1. Get project info
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('name, hld_text, lld_text')
      .eq('id', project_id)
      .single();

    if (projectError) {
      console.error('Error fetching project:', projectError);
      return NextResponse.json(
        { error: 'Failed to fetch project' },
        { status: 500 }
      );
    }

    // 2. Generate embedding for the question
    const questionEmbedding = await generateEmbedding(message);

    // 3. Search for relevant understandings using vector similarity
    const { data: similarUnderstandings, error: searchError } = await supabase
      .rpc('search_understandings', {
        query_project_id: project_id,
        query_embedding: questionEmbedding,
        match_threshold: 0.5,
        match_count: 5,
      });

    if (searchError) {
      console.error('Error searching understandings:', searchError);
    }

    // 4. Build context from search results
    const relevantContext = similarUnderstandings?.map((u: { module_name: string; developer_name: string; understanding_text: string; confidence_score: number; similarity: number }) => ({
      module: u.module_name,
      developer: u.developer_name,
      understanding: u.understanding_text,
      confidence: u.confidence_score,
      similarity: u.similarity,
    })) || [];

    // 5. Extract HLD/LLD excerpts (limit to avoid token overflow)
    const hldSummary = projectData.hld_text
      ? projectData.hld_text.substring(0, 500) + (projectData.hld_text.length > 500 ? '...' : '')
      : 'No HLD documentation available';

    const lldSummary = projectData.lld_text
      ? projectData.lld_text.substring(0, 500) + (projectData.lld_text.length > 500 ? '...' : '')
      : 'No LLD documentation available';

    // 6. Build conversation context
    const conversationContext = conversation_history
      .slice(-4)
      .map((msg: { role: string; content: string }) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    // 7. Build comprehensive prompt
    const prompt = `You are an AI assistant helping developers understand the ${projectData.name} codebase.

You have access to:
1. High-Level Design documentation
2. Low-Level Design documentation  
3. Team member understandings and consensus data

=== Project Documentation ===
HLD Summary: ${hldSummary}

LLD Summary: ${lldSummary}

=== Relevant Team Understandings ===
${relevantContext.length > 0 
  ? relevantContext.map((ctx: { module: string; developer: string; understanding: string; confidence: number; similarity: number }, idx: number) => `
${idx + 1}. Module: ${ctx.module}
   Developer: ${ctx.developer} (confidence: ${ctx.confidence}/5)
   Understanding: ${ctx.understanding}
   Relevance: ${(ctx.similarity * 100).toFixed(0)}%
`).join('\n')
  : 'No relevant team understandings found for this query.'}

${conversationContext ? `=== Previous Conversation ===\n${conversationContext}\n` : ''}

=== User Question ===
${message}

Instructions:
- Answer clearly and concisely
- Cite specific developers and modules when referencing team understandings
- If multiple team members have different views, mention that
- If you don't know something, say so honestly
- Be friendly and helpful
- Keep response under 200 words
- Use markdown formatting (bold, lists, code blocks)

Provide your response:`;

    // 8. Call Gemini API
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text();

    console.log('AI response generated');

    // 9. Prepare sources for citation
    const sources = relevantContext.slice(0, 3).map((ctx: { module: string; developer: string; confidence: number }) => ({
      module: ctx.module,
      developer: ctx.developer,
      confidence: ctx.confidence || 3,
    }));

    return NextResponse.json({
      response: aiResponse,
      sources: sources.length > 0 ? sources : undefined,
    });

  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process chat message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
