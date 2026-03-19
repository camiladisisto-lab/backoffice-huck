'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { TrendingUp, Lightbulb, User, Briefcase, Sparkles } from 'lucide-react'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then(res => res.json())

const skillLabels: Record<string, string> = {
  comunicacion_efectiva: 'Comunicacion Efectiva',
  escucha_activa: 'Escucha Activa',
  trabajo_en_equipo: 'Trabajo en Equipo',
  empatia: 'Empatia',
  adaptabilidad: 'Adaptabilidad',
  gestion_del_tiempo: 'Gestion del Tiempo',
  responsabilidad: 'Responsabilidad',
  pensamiento_critico: 'Pensamiento Critico'
}

// Sugerencias de conocimiento por puesto
const knowledgeSuggestions: Record<string, string[]> = {
  lider_de_equipo: [
    'Curso de Liderazgo Transformacional',
    'Gestion de Equipos de Alto Rendimiento',
    'Comunicacion Asertiva para Lideres',
    'Metodologias Agiles (Scrum, Kanban)'
  ],
  gestor_de_proyectos: [
    'Certificacion PMP (Project Management Professional)',
    'Metodologia PRINCE2',
    'Gestion de Riesgos en Proyectos',
    'Herramientas de Gestion: Jira, Asana, Monday'
  ],
  analista_de_datos: [
    'Analisis de Datos con Python/R',
    'Visualizacion de Datos (Tableau, Power BI)',
    'SQL Avanzado',
    'Estadistica Aplicada a Negocios'
  ],
  atencion_al_cliente: [
    'Tecnicas de Atencion al Cliente',
    'Manejo de Conflictos y Quejas',
    'Inteligencia Emocional en el Servicio',
    'CRM y Gestion de Relaciones'
  ],
  recursos_humanos: [
    'Gestion del Talento Humano',
    'Legislacion Laboral Actualizada',
    'Entrevistas por Competencias',
    'Clima Organizacional y Bienestar'
  ],
  desarrollador_senior: [
    'Arquitectura de Software',
    'Patrones de Diseno Avanzados',
    'DevOps y CI/CD',
    'Mentoria y Code Review'
  ],
  ejecutivo_de_ventas: [
    'Tecnicas de Negociacion Avanzada',
    'Venta Consultiva',
    'CRM y Pipeline de Ventas',
    'Psicologia del Consumidor'
  ],
  coordinador_operativo: [
    'Lean Management',
    'Mejora Continua de Procesos',
    'KPIs y Metricas Operativas',
    'Gestion de Recursos y Logistica'
  ]
}

interface TalentMatch {
  user: string
  position: string
  positionName: string
  matchedSkills: string[]
  totalPositionSkills: number
}

export function TalentGrowthTable() {
  const { data, isLoading } = useSWR('/api/talent-growth', fetcher)
  const [selectedMatch, setSelectedMatch] = useState<TalentMatch | null>(null)
  const [showSuggestionsDialog, setShowSuggestionsDialog] = useState(false)

  const matches: TalentMatch[] = data?.matches || []

  // Group by user to count unique position matches
  const uniqueUsers = new Set(matches.map(m => m.user))
  const uniquePositions = new Set(matches.map(m => m.position))

  const handleSuggestKnowledge = (match: TalentMatch) => {
    setSelectedMatch(match)
    setShowSuggestionsDialog(true)
  }

  return (
    <div className="space-y-8">
      {/* Resumen de estadisticas */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-border shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-semibold tracking-tight text-foreground">{matches.length}</p>
            <p className="text-sm text-muted-foreground">Matches Detectados</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-border shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-semibold tracking-tight text-foreground">{uniqueUsers.size}</p>
            <p className="text-sm text-muted-foreground">Usuarios con Potencial</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-border shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-semibold tracking-tight text-foreground">{uniquePositions.size}</p>
            <p className="text-sm text-muted-foreground">Puestos con Match</p>
          </div>
        </div>
      </div>

      {/* Tabla de matches */}
      <div className="rounded-2xl border border-border bg-white shadow-sm">
        <div className="px-6 py-5 border-b border-border">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Talento en Crecimiento</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Usuarios con 3 o mas habilidades blandas que hacen match con puestos clave
          </p>
        </div>
        <div className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Puesto Potencial</TableHead>
                <TableHead>Habilidades en Comun</TableHead>
                <TableHead>Match</TableHead>
                <TableHead className="text-right">Accion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Analizando talento...
                  </TableCell>
                </TableRow>
              ) : matches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No se encontraron matches. Los usuarios necesitan desarrollar mas habilidades blandas.
                  </TableCell>
                </TableRow>
              ) : (
                matches.map((match, index) => (
                  <TableRow key={`${match.user}-${match.position}-${index}`} className="hover:bg-muted/50">
                    <TableCell>
                      <Link 
                        href={`/usuario/${encodeURIComponent(match.user)}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {match.user}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{match.positionName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {match.matchedSkills.slice(0, 3).map(skill => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skillLabels[skill] || skill}
                          </Badge>
                        ))}
                        {match.matchedSkills.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{match.matchedSkills.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-emerald-600">
                          {match.matchedSkills.length}/{match.totalPositionSkills}
                        </span>
                        <span className="text-muted-foreground text-sm">habilidades</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="gap-2"
                        onClick={() => handleSuggestKnowledge(match)}
                      >
                        <Lightbulb className="h-4 w-4" />
                        Sugerir conocimiento
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialog de sugerencias */}
      <Dialog open={showSuggestionsDialog} onOpenChange={setShowSuggestionsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Sugerencias de Conocimiento
            </DialogTitle>
            <DialogDescription>
              Recursos recomendados para {selectedMatch?.user} en el rol de {selectedMatch?.positionName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium text-sm mb-2">Habilidades actuales del usuario:</h4>
              <div className="flex flex-wrap gap-1">
                {selectedMatch?.matchedSkills.map(skill => (
                  <Badge key={skill} className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                    {skillLabels[skill] || skill}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-3">Cursos y recursos sugeridos:</h4>
              <ul className="space-y-2">
                {selectedMatch && knowledgeSuggestions[selectedMatch.position]?.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2 p-3 rounded-lg border border-border bg-white">
                    <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
