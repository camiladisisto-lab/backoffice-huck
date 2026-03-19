import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function GET(
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
  const transcriptionsSummary = recordings.map((r, i) => {
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
      system: `Eres un experto en desarrollo personal y recursos humanos. Tu tarea es analizar las grabaciones de reflexiones diarias de un usuario y generar un reporte completo sobre su estado general, crecimiento y areas de mejora.

El reporte debe ser profesional pero cercano, enfocado en el desarrollo personal del usuario.`,
      prompt: `Genera un reporte del estado general del usuario "${userId}" basado en sus ${recordings.length} grabaciones.

ESTADISTICAS:
- Total de grabaciones: ${recordings.length}
- Sentimiento positivo: ${sentimentCount.positive} veces
- Sentimiento neutral: ${sentimentCount.neutral} veces
- Sentimiento negativo: ${sentimentCount.negative} veces
- Habilidades detectadas: ${Object.entries(skillsCount).map(([k, v]) => `${k}: ${v} veces`).join(', ')}

TRANSCRIPCIONES:
${transcriptionsSummary}

Por favor genera un reporte que incluya:
1. RESUMEN GENERAL: Un parrafo describiendo el estado general del usuario
2. FORTALEZAS: Las habilidades y aspectos positivos mas destacados
3. AREAS DE CRECIMIENTO: Donde el usuario ha mostrado mejora con el tiempo
4. AREAS DE MEJORA: Aspectos que podrian trabajarse
5. RECOMENDACIONES: Sugerencias concretas para el desarrollo personal

Responde en espanol, de forma profesional pero empatica.`
    })

    return NextResponse.json({
      userId,
      totalRecordings: recordings.length,
      skillsCount,
      sentimentCount,
      report: result.text
    })
  } catch (error) {
    console.error('[v0] Error generating report:', error)
    return NextResponse.json({ 
      error: `Error generando reporte: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}
