import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { clusterUnderstandings, calculateConsensus } from '@/lib/clustering';
import { Understanding } from '@/lib/db-types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id } = body;

    if (!project_id) {
      return NextResponse.json(
        { error: 'project_id is required' },
        { status: 400 }
      );
    }

    console.log(`Generating Development Intelligence Report for project: ${project_id}`);

    // Fetch project info
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

    // Fetch ALL understandings for project
    const { data: understandingsData, error: understandingsError } = await supabase
      .from('understandings')
      .select('*')
      .eq('project_id', project_id)
      .order('created_at', { ascending: false });

    if (understandingsError) {
      console.error('Error fetching understandings:', understandingsError);
      return NextResponse.json(
        { error: 'Failed to fetch understandings' },
        { status: 500 }
      );
    }

    let allUnderstandings = understandingsData as Understanding[];

    if (allUnderstandings.length === 0) {
      return NextResponse.json(
        { error: 'No understandings found for this project' },
        { status: 400 }
      );
    }

    // Parse embeddings
    allUnderstandings = allUnderstandings.map(u => {
      if (u.embedding && typeof u.embedding === 'string') {
        try {
          const embeddingStr = (u.embedding as string).trim();
          const jsonStr = embeddingStr.startsWith('[') ? embeddingStr : `[${embeddingStr}]`;
          u.embedding = JSON.parse(jsonStr) as number[];
        } catch {
          u.embedding = null;
        }
      }
      return u;
    });

    // Group by module
    const moduleMap = new Map<string, Understanding[]>();
    allUnderstandings.forEach(u => {
      if (!moduleMap.has(u.module_name)) {
        moduleMap.set(u.module_name, []);
      }
      moduleMap.get(u.module_name)!.push(u);
    });

    // Calculate consensus for each module
    const moduleAnalysis: {
      module: string;
      consensus: number;
      clusters: any[];
      understandingCount: number;
      contributors: string[];
    }[] = [];
    moduleMap.forEach((understandings, moduleName) => {
      const validUnderstandings = understandings.filter(u => u.embedding);
      if (validUnderstandings.length >= 2) {
        const clusters = clusterUnderstandings(validUnderstandings);
        const consensus = calculateConsensus(clusters);
        moduleAnalysis.push({
          module: moduleName,
          consensus,
          clusters,
          understandingCount: understandings.length,
          contributors: Array.from(new Set(understandings.map(u => u.developer_name))),
        });
      } else {
        moduleAnalysis.push({
          module: moduleName,
          consensus: 100,
          clusters: [],
          understandingCount: understandings.length,
          contributors: Array.from(new Set(understandings.map(u => u.developer_name))),
        });
      }
    });

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUnderstandings = allUnderstandings.filter(u => 
      new Date(u.created_at) >= sevenDaysAgo
    );

    // Group recent activity by module
    const recentByModule = new Map<string, Understanding[]>();
    recentUnderstandings.forEach(u => {
      if (!recentByModule.has(u.module_name)) {
        recentByModule.set(u.module_name, []);
      }
      recentByModule.get(u.module_name)!.push(u);
    });

    // Unique developers
    const uniqueDevelopers = new Set(allUnderstandings.map(u => u.developer_name));

    // Build module activity section
    const moduleActivityText = Array.from(recentByModule.entries())
      .map(([module, understandings]) => {
        const latest = understandings[0];
        const daysAgo = Math.floor((Date.now() - new Date(latest.created_at).getTime()) / (1000 * 60 * 60 * 24));
        return `- ${module}: ${understandings.length} new understandings
  Latest by ${latest.developer_name} ${daysAgo} days ago`;
      })
      .join('\n');

    // Build team alignment section
    const teamAlignmentText = moduleAnalysis
      .map(m => {
        let text = `- ${m.module}: ${m.consensus.toFixed(1)}% consensus`;
        if (m.clusters.length >= 2) {
          text += `\n  * ${m.clusters[0].percentage.toFixed(1)}%: ${m.clusters[0].representative_text.substring(0, 80)}...`;
          text += `\n  * ${m.clusters[1].percentage.toFixed(1)}%: ${m.clusters[1].representative_text.substring(0, 80)}...`;
        }
        return text;
      })
      .join('\n');

    // Recent highlights
    const recentHighlights = recentUnderstandings
      .slice(0, 5)
      .map(u => `- ${u.module_name} by ${u.developer_name}: "${u.understanding_text.substring(0, 100)}..."`)
      .join('\n');

    // Extract HLD/LLD key points
    const hldPoints = projectData.hld_text 
      ? projectData.hld_text.substring(0, 500) + '...'
      : 'No HLD provided';
    const lldPoints = projectData.lld_text
      ? projectData.lld_text.substring(0, 500) + '...'
      : 'No LLD provided';

    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Build comprehensive prompt
    const prompt = `You are a technical project manager generating a Development Intelligence Report.

Project: ${projectData.name}
Report Date: ${currentDate}

=== Project Overview ===
Total Modules: ${moduleMap.size}
Total Understandings: ${allUnderstandings.length}
Active Contributors: ${uniqueDevelopers.size}

=== Module Activity (Last 7 Days) ===
${moduleActivityText || 'No recent activity'}

=== Team Alignment Status ===
${teamAlignmentText}

=== Recent Understanding Highlights ===
${recentHighlights}

=== Original Design Intent ===
HLD Key Points: ${hldPoints}
LLD Key Points: ${lldPoints}

===================================

Generate a comprehensive Development Intelligence Report in this markdown format:

# Development Intelligence Report
**Project:** ${projectData.name}
**Generated:** ${currentDate}
**Period:** Last 7 days

---

## 📊 Executive Summary

[2-3 sentences: overall project health, key developments, major themes]

## 🎯 Active Development Areas

[For each module with recent activity, in priority order]:

### [Module Name] ([consensus]% Team Alignment)

**Current Status:** [In Progress / Well-Defined / Needs Discussion]
**Contributors:** [list developers]
**Activity:** [X] updates in last 7 days

**What's Being Built:**
[Synthesize recent understandings into coherent summary of current work]

**Team Approach:**
[Describe the majority consensus approach]

[If consensus < 70%]:
**⚠️ Alignment Issue Detected:**
[Describe the divergence and why it matters]

---

## 🔴 Risk Areas & Action Items

[Identify modules/areas that need attention]:

### High Priority
- **[Module]**: [Issue and recommended action]
- **[Module]**: [Issue and recommended action]

### Medium Priority
- [If any]

## ✅ Well-Aligned Modules

[List modules with >80% consensus]:
- **[Module]** (90% alignment): [Brief description of solid approach]

## 📈 Architecture Evolution

**Design Intent vs. Current Implementation:**
[Compare original HLD/LLD with current team understanding]

**Notable Changes:**
[List any significant architectural shifts from original design]

**Emerging Patterns:**
[Identify any new architectural patterns the team is converging on]

## 💡 Knowledge Gaps

[Identify areas that need more documentation]:
- [Module with few understandings]
- [Complex areas with low confidence scores]

## 📅 Recommended Next Steps

1. [Prioritized action item 1]
2. [Prioritized action item 2]
3. [Prioritized action item 3]

---

**Report Confidence:** [Based on understanding count and consensus levels]
**Next Review:** Recommended in [X] days

Be specific, actionable, and highlight both problems and wins. Return ONLY the markdown, no other text.`;

    // Call Gemini API with better model for analysis
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();

    console.log('Generated Development Intelligence Report');

    // Extract executive summary (first paragraph after Executive Summary heading)
    const summaryMatch = content.match(/## 📊 Executive Summary\s+([\s\S]*?)(?=\n##|$)/);
    const summary = summaryMatch ? summaryMatch[1].trim().substring(0, 300) : '';

    // Get next report number
    const { data: existingReports } = await supabase
      .from('dev_reports')
      .select('report_number')
      .eq('project_id', project_id)
      .order('report_number', { ascending: false })
      .limit(1);

    const nextReportNumber = existingReports && existingReports.length > 0 
      ? existingReports[0].report_number + 1 
      : 1;

    // Calculate metadata snapshot
    const avgConsensus = moduleAnalysis.reduce((sum, m) => sum + m.consensus, 0) / moduleAnalysis.length;
    const metadata = {
      total_understandings: allUnderstandings.length,
      total_modules: moduleMap.size,
      active_contributors: uniqueDevelopers.size,
      avg_consensus: avgConsensus,
      recent_activity_count: recentUnderstandings.length,
      low_consensus_modules: moduleAnalysis.filter(m => m.consensus < 50).length,
    };

    // Save to database
    const { data: savedReport, error: saveError } = await supabase
      .from('dev_reports')
      .insert({
        project_id,
        report_number: nextReportNumber,
        content,
        summary,
        metadata,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving report:', saveError);
      // Continue anyway, return the content
    }

    return NextResponse.json({
      content,
      report_number: nextReportNumber,
      summary,
      metadata,
      report_id: savedReport?.id,
      success: true,
    });

  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
