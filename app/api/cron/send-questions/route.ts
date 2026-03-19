import { NextRequest, NextResponse } from 'next/server'

// Banco de preguntas para reflexion
const QUESTION_BANK = [
  "¿Cual fue el problema mas dificil que tuviste que resolver hoy y como lo solucionaste?",
  "¿Tuviste alguna situacion hoy donde un cliente o companero se fue contento gracias a tu ayuda?",
  "¿Hiciste algo hoy, por mas minimo que sea, para que tu trabajo o el del equipo sea mas rapido o facil?",
  "¿Le diste una mano a alguien hoy con algo que no sabia hacer, o alguien te ayudo a vos?",
  "¿Que cosa nueva aprendiste a hacer esta semana o sentis que ahora haces mucho mejor?"
]

function getRandomQuestion(): string {
  const randomIndex = Math.floor(Math.random() * QUESTION_BANK.length)
  return QUESTION_BANK[randomIndex]
}

// URL de la app destino - configurar en variables de entorno
const TARGET_WEBHOOK_URL = process.env.TARGET_WEBHOOK_URL || 'https://humand-ascend-mvp-nu.vercel.app/api/webhook'

export async function GET(request: NextRequest) {
  // Verificar que sea una llamada del cron de Vercel
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // En desarrollo, permitir sin auth
    if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const question = getRandomQuestion()
    
    const payload = {
      type: 'reflection_question',
      question,
      timestamp: new Date().toISOString(),
      source: 'backoffice-huck',
      automatic: true
    }

    const response = await fetch(TARGET_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[v0] Cron error:', errorText)
      return NextResponse.json({ 
        success: false, 
        error: `Error en destino: ${response.status}`,
        targetUrl: TARGET_WEBHOOK_URL
      }, { status: 200 }) // Retornamos 200 para que el cron no reintente
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Pregunta enviada automaticamente',
      questionSent: question,
      targetUrl: TARGET_WEBHOOK_URL,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[v0] Cron error:', error)
    return NextResponse.json({ 
      success: false,
      error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      targetUrl: TARGET_WEBHOOK_URL
    }, { status: 200 })
  }
}
