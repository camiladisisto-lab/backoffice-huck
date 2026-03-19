import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { analyzeTranscription } from '@/lib/ai/analyze-transcription'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const searchParams = request.nextUrl.searchParams
  const search = searchParams.get('search')
  const userId = searchParams.get('userId')
  const skills = searchParams.getAll('skills')
  const sortBySentiment = searchParams.get('sortBySentiment')
  const sortByDate = searchParams.get('sortByDate')
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
  if (sortByDate) {
    query = query.order('created_at', { ascending: sortByDate === 'asc' })
  } else if (!sortBySentiment) {
    query = query.order('created_at', { ascending: false })
  }
  
  query = query.range(offset, offset + limit - 1)

  if (search) {
    query = query.or(`user_identifier.ilike.%${search}%,transcription.ilike.%${search}%`)
  }

  if (userId) {
    query = query.eq('user_identifier', userId)
  }

  // Filter by skills (OR logic) - fetch all then filter client-side for OR
  const { data, error, count } = await query
  
  let filteredData = data
  if (skills && skills.length > 0 && data) {
    filteredData = data.filter(recording => 
      recording.soft_skills && 
      skills.some(skill => recording.soft_skills.includes(skill))
    )
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const total = skills && skills.length > 0 ? filteredData?.length || 0 : count || 0

  return NextResponse.json({
    data: filteredData,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
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
