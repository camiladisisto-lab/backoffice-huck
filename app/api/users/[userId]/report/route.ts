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
    // Check if report exists
    const { data: existingReport, error: fetchError } = await supabase
      .from('user_reports')
      .select('*')
      .eq('user_identifier', userId)
      .single()

    // Table might not exist yet - that's ok
    if (fetchError && fetchError.code === 'PGRST205') {
      return NextResponse.json({ userId, report: null, cached: false, tableNotExists: true })
    }

    if (existingReport) {
      return NextResponse.json({
        userId,
        report: existingReport.report,
        skillsCount: existingReport.skills_count,
        sentimentCount: existingReport.sentiment_count,
        totalRecordings: existingReport.total_recordings,
        createdAt: existingReport.created_at,
        updatedAt: existingReport.updated_at,
        cached: true
      })
    }
  } catch (e) {
    // Ignore errors - table might not exist
  }

  // No report exists
  return NextResponse.json({ userId, report: null, cached: false })
}

// POST: Generate new report (or regenerate)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  const supabase = await createClient()

  // Get all recordings for this user
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

  // Prepare transcriptions summary
  const transcriptionsSummary = recordings.map((r) => {
    const date = new Date(r.created_at).toLocaleDateString('es-ES')
    const skills = r.soft_skills?.join(', ') || 'ninguna'
    return `[${date}] Sentimiento: ${r.sentiment}, Habilidades: ${skills}\nTranscripcion: "${r.transcription.substring(0, 500)}${r.transcription.length > 500 ? '...' : ''}"`
  }).join('\n\n')

  // Count skills frequency
  const skillsCount: Record<string, number> = {}
  const sentimentCount = { positive: 0, negative: 0, neutral: 0 }
  
  recordings.forEach(r => {
    if (r.sentiment) sentimentCount[r.sentiment as keyof typeof sentimentCount]++
    r.soft_skills?.forEach((skill: string) => {
      skillsCount[skill] = (skillsCount[skill] || 0) + 1
    })
  })

  try {
    const result = await generateText({
      model: anthropic('claude-sonnet-4-6'),
      system: `Eres un experto en desarrollo personal. Genera descripciones MUY BREVES de personas basadas en sus reflexiones. Maximo 3-4 oraciones.`,
      prompt: `Genera una descripcion MUY BREVE (3-4 oraciones maximo) del usuario "${userId}" basada en ${recordings.length} grabaciones.

Datos: Sentimiento predominante: ${sentimentCount.positive > sentimentCount.negative ? 'positivo' : sentimentCount.negative > sentimentCount.positive ? 'negativo' : 'neutral'}. Habilidades: ${Object.keys(skillsCount).slice(0, 3).join(', ') || 'ninguna detectada'}.

Transcripciones recientes:
${transcriptionsSummary.substring(0, 1000)}

Responde en espanol con UNA descripcion breve que incluya: quien es esta persona, su principal fortaleza, y un area de mejora. SIN titulos ni secciones, solo texto corrido.`
    })

    // Save or update report in database
    const { error: upsertError } = await supabase
      .from('user_reports')
      .upsert({
        user_identifier: userId,
        report: result.text,
        skills_count: skillsCount,
        sentiment_count: sentimentCount,
        total_recordings: recordings.length,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_identifier'
      })

    

    return NextResponse.json({
      userId,
      totalRecordings: recordings.length,
      skillsCount,
      sentimentCount,
      report: result.text,
      cached: false
    })
  } catch (error) {
    console.error('[v0] Error generating report:', error)
    return NextResponse.json({ 
      error: `Error generando reporte: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}
