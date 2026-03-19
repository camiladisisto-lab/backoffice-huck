import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Definicion de puestos y las habilidades blandas que requieren
const positionSkills: Record<string, { name: string; skills: string[] }> = {
  lider_de_equipo: {
    name: 'Lider de Equipo',
    skills: ['comunicacion_efectiva', 'trabajo_en_equipo', 'responsabilidad', 'empatia']
  },
  gestor_de_proyectos: {
    name: 'Gestor de Proyectos',
    skills: ['gestion_del_tiempo', 'comunicacion_efectiva', 'trabajo_en_equipo', 'pensamiento_critico']
  },
  analista_de_datos: {
    name: 'Analista de Datos',
    skills: ['pensamiento_critico', 'comunicacion_efectiva', 'responsabilidad', 'adaptabilidad']
  },
  atencion_al_cliente: {
    name: 'Atencion al Cliente',
    skills: ['empatia', 'escucha_activa', 'comunicacion_efectiva', 'adaptabilidad']
  },
  recursos_humanos: {
    name: 'Recursos Humanos',
    skills: ['empatia', 'escucha_activa', 'comunicacion_efectiva', 'trabajo_en_equipo']
  },
  desarrollador_senior: {
    name: 'Desarrollador Senior',
    skills: ['pensamiento_critico', 'trabajo_en_equipo', 'comunicacion_efectiva', 'adaptabilidad']
  },
  ejecutivo_de_ventas: {
    name: 'Ejecutivo de Ventas',
    skills: ['comunicacion_efectiva', 'empatia', 'adaptabilidad', 'responsabilidad']
  },
  coordinador_operativo: {
    name: 'Coordinador Operativo',
    skills: ['gestion_del_tiempo', 'responsabilidad', 'trabajo_en_equipo', 'pensamiento_critico']
  }
}

export async function GET() {
  const supabase = await createClient()

  // Get all recordings grouped by user with their soft skills
  const { data: recordings, error } = await supabase
    .from('recordings')
    .select('user_identifier, soft_skills')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Aggregate soft skills per user
  const userSkills: Record<string, Set<string>> = {}
  
  recordings?.forEach(recording => {
    const user = recording.user_identifier
    if (!userSkills[user]) {
      userSkills[user] = new Set()
    }
    if (recording.soft_skills && Array.isArray(recording.soft_skills)) {
      recording.soft_skills.forEach((skill: string) => {
        userSkills[user].add(skill)
      })
    }
  })

  // Find matches between users and positions (3+ skills match)
  const matches: Array<{
    user: string
    position: string
    positionName: string
    matchedSkills: string[]
    totalPositionSkills: number
  }> = []

  Object.entries(userSkills).forEach(([user, skills]) => {
    Object.entries(positionSkills).forEach(([positionKey, position]) => {
      const matchedSkills = position.skills.filter(skill => skills.has(skill))
      if (matchedSkills.length >= 3) {
        matches.push({
          user,
          position: positionKey,
          positionName: position.name,
          matchedSkills,
          totalPositionSkills: position.skills.length
        })
      }
    })
  })

  // Sort by number of matched skills (descending)
  matches.sort((a, b) => b.matchedSkills.length - a.matchedSkills.length)

  return NextResponse.json({
    matches,
    positions: positionSkills
  })
}
