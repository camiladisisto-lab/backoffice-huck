import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// GET: Fetch existing report or return null
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  const supabase = await createClient()

  try {
    const { data: existingReport, error: fetchError } = await supabase
      .from('user_reports')
      .select('*')
      .eq('user_identifier', userId)
      .single()

    if (fetchError && fetchError.code === 'PGRST205') {
      return NextResponse.json({ userId, report: null, cached: false })
    }

    if (existingReport) {
      return NextResponse.json({
        userId,
        report: existingReport.report,
        cached: true
      })
    }
  } catch (e) {
    // Table might not exist
  }

  return NextResponse.json({ userId, report: null, cached: false })
}

// POST: Generate new report
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  const supabase = await createClient()

  const { data: recordings, error } = await supabase
    .from('recordings')
    .select('*')
    .eq('user_identifier', userId)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!recordings || recordings.length === 0) {
    return NextResponse.json({ error: 'No hay grabaciones para este usuario' }, { status: 404 })
  }

  // Count skills and sentiment
  const skillsCount: Record<string, number> = {}
  const sentimentCount = { positive: 0, negative: 0, neutral: 0 }
  
  recordings.forEach(r => {
    if (r.sentiment) sentimentCount[r.sentiment as keyof typeof sentimentCount]++
    r.soft_skills?.forEach((skill: string) => {
      skillsCount[skill] = (skillsCount[skill] || 0) + 1
    })
  })

  const predominant = sentimentCount.positive > sentimentCount.negative ? 'positivo' : sentimentCount.negative > sentimentCount.positive ? 'negativo' : 'neutral'
  const topSkills = Object.keys(skillsCount).slice(0, 3).join(', ') || 'ninguna'

  try {
    const result = await generateText({
      model: anthropic('claude-sonnet-4-6'),
      system: `Genera descripciones de personas en maximo 2 oraciones. Se muy conciso.`,
      prompt: `Describe en 2 oraciones: ${recordings.length} reflexiones, sentimiento ${predominant}, habilidades: ${topSkills}. En espanol, sin titulos.`
    })

    // Try to save (might fail if table doesn't exist)
    try {
      await supabase
        .from('user_reports')
        .upsert({
          user_identifier: userId,
          report: result.text,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_identifier' })
    } catch (e) {
      // Ignore - persistence is optional
    }

    return NextResponse.json({
      userId,
      report: result.text,
      cached: false
    })
  } catch (error) {
    return NextResponse.json({ 
      error: `Error generando reporte: ${error instanceof Error ? error.message : 'Unknown'}` 
    }, { status: 500 })
  }
}
