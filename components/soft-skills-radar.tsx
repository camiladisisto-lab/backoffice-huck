'use client'

import { useEffect, useState } from 'react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Loader2 } from 'lucide-react'

const softSkillLabels: Record<string, string> = {
  comunicacion_efectiva: 'Comunicacion Efectiva',
  escucha_activa: 'Escucha Activa',
  trabajo_en_equipo: 'Trabajo en Equipo',
  empatia: 'Empatia',
  adaptabilidad: 'Adaptabilidad',
  gestion_del_tiempo: 'Gestion del Tiempo',
  responsabilidad: 'Responsabilidad',
  pensamiento_critico: 'Pensamiento Critico'
}

const chartConfig = {
  value: {
    label: 'Ocurrencias',
    color: '#3b82f6',
  },
}

interface SoftSkillsRadarProps {
  userId: string
}

export function SoftSkillsRadar({ userId }: SoftSkillsRadarProps) {
  const [skillCounts, setSkillCounts] = useState<Record<string, number> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const response = await fetch(`/api/users/${encodeURIComponent(userId)}/soft-skills`)
        const data = await response.json()
        if (data.skillCounts) {
          setSkillCounts(data.skillCounts)
        }
      } catch (error) {
        console.error('Error fetching soft skills:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSkills()
  }, [userId])

  const chartData = skillCounts
    ? Object.entries(skillCounts).map(([key, value]) => ({
        skill: softSkillLabels[key] || key,
        value: value,
      }))
    : []

  const maxValue = Math.max(...chartData.map(d => d.value), 1)

  return (
    <div className="rounded-2xl bg-white border border-border shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-lg font-semibold tracking-tight">Habilidades Blandas</h2>
        <p className="text-sm text-muted-foreground">Cantidad de ocurrencias detectadas en las grabaciones</p>
      </div>
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-3" />
            <span>Cargando habilidades...</span>
          </div>
        ) : chartData.every(d => d.value === 0) ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No se han detectado habilidades blandas en las grabaciones.</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[350px]">
            <RadarChart data={chartData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis 
                dataKey="skill" 
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickLine={false}
              />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, maxValue]} 
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                axisLine={false}
                tickCount={5}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Radar
                name="Ocurrencias"
                dataKey="value"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ChartContainer>
        )}
      </div>
    </div>
  )
}
