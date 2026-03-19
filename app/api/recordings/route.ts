import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { analyzeTranscription } from '@/lib/ai/analyze-transcription'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status')
  const search = searchParams.get('search')
  const userId = searchParams.get('userId')
  const skill = searchParams.get('skill')
  const sortBySentiment = searchParams.get('sortBySentiment')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const offset = (page - 1) * limit

  let query = supabase
    .from('recordings')
    .select('*', { count: 'exact' })

  // Apply sorting
  if (sortBySentiment) {
    query = query.order('sentiment', { ascending: sortBySentiment === 'asc' })
  }
  query = query.order('created_at', { ascending: false })
  
  query = query.range(offset, offset + limit - 1)

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(`user_identifier.ilike.%${search}%,transcription.ilike.%${search}%`)
  }

  if (userId) {
    query = query.eq('user_identifier', userId)
  }

  if (skill) {
    query = query.contains('soft_skills', [skill])
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const body = await request.json()
  
  const { user_identifier, transcription, duration_seconds, language, metadata } = body

  if (!user_identifier || !transcription) {
    return NextResponse.json(
      { error: 'user_identifier y transcription son requeridos' },
      { status: 400 }
    )
  }

  // Analizar la transcripcion con IA para detectar habilidades blandas y sentimiento
  console.log('[v0] Calling analyzeTranscription for:', user_identifier)
  const analysis = await analyzeTranscription(transcription)
  console.log('[v0] Analysis completed:', JSON.stringify(analysis))

  const { data, error } = await supabase
    .from('recordings')
    .insert({
      user_identifier,
      transcription,
      duration_seconds,
      language: language || 'es',
      metadata: metadata || {},
      status: 'pending',
      sentiment: analysis.sentiment,
      soft_skills: analysis.soft_skills
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ 
    data,
    analysis_debug: {
      sentiment: analysis.sentiment,
      soft_skills: analysis.soft_skills,
      reasoning: analysis.reasoning
    }
  }, { status: 201 })
}
