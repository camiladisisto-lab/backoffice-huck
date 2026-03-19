import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { targetUrl, type, userId, data } = body

  if (!targetUrl) {
    return NextResponse.json({ error: 'Se requiere targetUrl' }, { status: 400 })
  }

  try {
    const payload = {
      type: type || 'notification',
      userId,
      data,
      timestamp: new Date().toISOString(),
      source: 'backoffice-huck'
    }

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
