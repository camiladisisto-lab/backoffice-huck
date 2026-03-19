import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  const body = await request.json()
  const { report } = body

  if (!report) {
    return NextResponse.json({ error: 'Se requiere el reporte previo' }, { status: 400 })
  }

  const supabase = await createClient()

  // Get user stats for additional context
  const { data: recordings } = await supabase
    .from('recordings')
    .select('*')
    .eq('user_identifier', userId)
    .order('created_at', { ascending: true })

  const totalDays = recordings?.length || 0
  
  // Calculate streak
  let maxStreak = 0
  let currentStreak = 0
  let lastDate: Date | null = null
  
  recordings?.forEach(r => {
    const date = new Date(r.created_at)
    date.setHours(0, 0, 0, 0)
    
    if (lastDate) {
      const diffDays = Math.floor((date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays === 1) {
        currentStreak++
      } else if (diffDays > 1) {
        currentStreak = 1
      }
    } else {
      currentStreak = 1
    }
    
    maxStreak = Math.max(maxStreak, currentStreak)
    lastDate = date
  })

  try {
    const result = await generateText({
      model: anthropic('claude-sonnet-4-6'),
      system: `Eres un experto en recursos humanos redactando cartas de recomendacion profesionales. 
Tu tarea es generar una carta de recomendacion basada en el analisis de las reflexiones diarias de un usuario.
La carta debe ser formal pero calida, destacando las fortalezas y el compromiso del usuario con su desarrollo personal.`,
      prompt: `Genera una carta de recomendacion profesional para "${userId}" basada en el siguiente reporte de analisis:

REPORTE:
${report}

DATOS ADICIONALES:
- El usuario ha grabado ${totalDays} reflexiones
- Su racha maxima de dias consecutivos fue de ${maxStreak} dias
- Ha demostrado compromiso constante con su desarrollo personal

La carta debe:
1. Tener un formato de carta formal
2. Mencionar el contexto (programa de reflexiones diarias)
3. Destacar las principales fortalezas observadas
4. Mencionar el crecimiento y compromiso demostrado
5. Dar una recomendacion positiva general
6. Tener una extension de 3-4 parrafos

Firma la carta como "Equipo de Desarrollo Personal".
Responde en espanol.`
    })

    return NextResponse.json({
      userId,
      letter: result.text
    })
  } catch (error) {
    console.error('[v0] Error generating recommendation:', error)
    return NextResponse.json({ 
      error: `Error generando carta: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}
