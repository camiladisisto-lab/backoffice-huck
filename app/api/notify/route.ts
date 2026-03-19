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

// POST manual para testing
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { targetUrl, type, userId, data, customQuestion } = body

  if (!targetUrl) {
    return NextResponse.json({ error: 'Se requiere targetUrl' }, { status: 400 })
  }

  try {
    const question = customQuestion || getRandomQuestion()
    
    const payload = {
      type: type || 'reflection_question',
      question,
      userId,
      data,
      timestamp: new Date().toISOString(),
      source: 'backoffice-huck'
    }

    console.log('[v0] Sending notification to:', targetUrl)
    console.log('[v0] Payload:', JSON.stringify(payload, null, 2))

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ 
        success: false, 
        error: `Error en destino: ${response.status} - ${errorText}` 
      }, { status: response.status })
    }

    let responseData
    try {
      responseData = await response.json()
    } catch {
      responseData = { message: 'Notificacion enviada' }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Notificacion enviada exitosamente',
      question,
      response: responseData
    })
  } catch (error) {
    console.error('[v0] Error sending notification:', error)
    return NextResponse.json({ 
      success: false,
      error: `Error enviando notificacion: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}
