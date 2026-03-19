'use client'

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

const softSkillsData = [
  { skill: 'Comunicacion', value: 85, fullMark: 100 },
  { skill: 'Empatia', value: 78, fullMark: 100 },
  { skill: 'Liderazgo', value: 65, fullMark: 100 },
  { skill: 'Trabajo en equipo', value: 90, fullMark: 100 },
  { skill: 'Resolucion de problemas', value: 72, fullMark: 100 },
  { skill: 'Adaptabilidad', value: 80, fullMark: 100 },
]

const chartConfig = {
  value: {
    label: 'Nivel',
    color: '#3b82f6',
  },
}

export function SoftSkillsRadar() {
  return (
    <div className="rounded-2xl bg-white border border-border shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-lg font-semibold tracking-tight">Habilidades Blandas</h2>
        <p className="text-sm text-muted-foreground">Analisis de competencias basado en las grabaciones</p>
      </div>
      <div className="p-6">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[350px]">
          <RadarChart data={softSkillsData}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis 
              dataKey="skill" 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={false}
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 100]} 
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              axisLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Radar
              name="Nivel"
              dataKey="value"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RadarChart>
        </ChartContainer>
      </div>
    </div>
  )
}
