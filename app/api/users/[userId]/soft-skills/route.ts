import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  const supabase = await createClient()

  // Get all recordings for this user
  const { data: recordings, error } = await supabase
    .from('recordings')
    .select('soft_skills')
    .eq('user_identifier', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Count occurrences of each soft skill
  const skillCounts: Record<string, number> = {
    comunicacion_efectiva: 0,
    escucha_activa: 0,
    trabajo_en_equipo: 0,
    empatia: 0,
    adaptabilidad: 0,
    gestion_del_tiempo: 0,
    responsabilidad: 0,
    pensamiento_critico: 0
  }

  recordings?.forEach(recording => {
    if (recording.soft_skills && Array.isArray(recording.soft_skills)) {
      recording.soft_skills.forEach((skill: string) => {
        if (skill in skillCounts) {
          skillCounts[skill]++
        }
      })
    }
  })

  return NextResponse.json({
    userId,
    totalRecordings: recordings?.length || 0,
    skillCounts
  })
}
