'use client'

import { useState } from 'react'
import { useRecordings, deleteRecording } from '@/hooks/use-recordings'
import type { Recording } from '@/lib/types/recording'
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
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MoreHorizontal, Search, ChevronLeft, ChevronRight, Eye, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react'

const sentimentEmojis: Record<string, { emoji: string; label: string }> = {
  positive: { emoji: '😊', label: 'Positivo' },
  negative: { emoji: '😔', label: 'Negativo' },
  neutral: { emoji: '😐', label: 'Neutral' }
}

const softSkillLabels: Record<string, { label: string; color: string }> = {
  comunicacion_efectiva: { label: 'Comunicacion Efectiva', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  escucha_activa: { label: 'Escucha Activa', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  trabajo_en_equipo: { label: 'Trabajo en Equipo', color: 'bg-primary/10 text-primary border-primary/20' },
  empatia: { label: 'Empatia', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  adaptabilidad: { label: 'Adaptabilidad', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  gestion_del_tiempo: { label: 'Gestion del Tiempo', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  responsabilidad: { label: 'Responsabilidad', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  pensamiento_critico: { label: 'Pensamiento Critico', color: 'bg-rose-100 text-rose-700 border-rose-200' }
}

export function RecordingsTable({ userId }: { userId?: string } = {}) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null)
  const [skillFilters, setSkillFilters] = useState<string[]>([])
  const [sortBySentiment, setSortBySentiment] = useState<'asc' | 'desc' | null>(null)
  const [sortByDate, setSortByDate] = useState<'asc' | 'desc' | null>(null)

  const { recordings, pagination, isLoading, mutate } = useRecordings({
    page,
    limit: 10,
    search,
    userId,
    skills: skillFilters.length > 0 ? skillFilters : undefined,
    sortBySentiment,
    sortByDate
  })
  
  const toggleSkillFilter = (skill: string) => {
    setSkillFilters(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    )
    setPage(1)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta grabación?')) {
      await deleteRecording(id)
      mutate()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por usuario o transcripcion..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="secondary">Buscar</Button>
          </form>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Habilidades
                {skillFilters.length > 0 && (
                  <Badge variant="secondary" className="ml-1 rounded-full px-2">
                    {skillFilters.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <div className="space-y-2">
                <p className="text-sm font-medium mb-3">Filtrar por habilidades</p>
                {Object.entries(softSkillLabels).map(([key, { label }]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={skillFilters.includes(key)}
                      onCheckedChange={() => toggleSkillFilter(key)}
                    />
                    <label htmlFor={key} className="text-sm cursor-pointer">
                      {label}
                    </label>
                  </div>
                ))}
                {skillFilters.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-2"
                    onClick={() => { setSkillFilters([]); setPage(1) }}
                  >
                    Limpiar filtros
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">
                <button
                  onClick={() => {
                    if (sortBySentiment === null) setSortBySentiment('asc')
                    else if (sortBySentiment === 'asc') setSortBySentiment('desc')
                    else setSortBySentiment(null)
                    setPage(1)
                  }}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  Sentimiento
                  {sortBySentiment === null && <ArrowUpDown className="h-4 w-4 text-muted-foreground" />}
                  {sortBySentiment === 'asc' && <ArrowUp className="h-4 w-4 text-primary" />}
                  {sortBySentiment === 'desc' && <ArrowDown className="h-4 w-4 text-primary" />}
                </button>
              </TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead className="hidden md:table-cell">Transcripcion</TableHead>
              <TableHead className="hidden lg:table-cell">Habilidades</TableHead>
              <TableHead className="hidden sm:table-cell">Duracion</TableHead>
              <TableHead className="hidden lg:table-cell">
                <button
                  onClick={() => {
                    if (sortByDate === null) setSortByDate('desc')
                    else if (sortByDate === 'desc') setSortByDate('asc')
                    else setSortByDate(null)
                    setPage(1)
                  }}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  Fecha
                  {sortByDate === null && <ArrowUpDown className="h-4 w-4 text-muted-foreground" />}
                  {sortByDate === 'desc' && <ArrowDown className="h-4 w-4 text-primary" />}
                  {sortByDate === 'asc' && <ArrowUp className="h-4 w-4 text-primary" />}
                </button>
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Cargando grabaciones...
                </TableCell>
              </TableRow>
            ) : recordings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No se encontraron grabaciones
                </TableCell>
              </TableRow>
            ) : (
              recordings.map((recording) => (
                <TableRow key={recording.id}>
                  <TableCell>
                    <span 
                      className="text-2xl" 
                      title={sentimentEmojis[recording.sentiment || 'neutral']?.label}
                    >
                      {sentimentEmojis[recording.sentiment || 'neutral']?.emoji || '😐'}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{recording.user_identifier}</TableCell>
                  <TableCell className="hidden md:table-cell max-w-xs">
                    <span className="text-muted-foreground">
                      {truncateText(recording.transcription, 50)}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {recording.soft_skills && recording.soft_skills.length > 0 ? (
                        recording.soft_skills.slice(0, 2).map((skill) => (
                          <Badge 
                            key={skill} 
                            variant="secondary" 
                            className={`text-xs ${softSkillLabels[skill]?.color || 'bg-gray-100 text-gray-800'}`}
                          >
                            {softSkillLabels[skill]?.label?.split(' ')[0] || skill}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                      {recording.soft_skills && recording.soft_skills.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{recording.soft_skills.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {formatDuration(recording.duration_seconds)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {formatDate(recording.created_at)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Abrir menú</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedRecording(recording)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(recording.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {((page - 1) * 10) + 1} - {Math.min(page * 10, pagination.total)} de {pagination.total} registros
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {page} de {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!selectedRecording} onOpenChange={() => setSelectedRecording(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle de Grabación</DialogTitle>
            <DialogDescription>
              Información completa de la transcripción
            </DialogDescription>
          </DialogHeader>
          {selectedRecording && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Usuario</p>
                  <p className="mt-1">{selectedRecording.user_identifier}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sentimiento</p>
                  <p className="mt-1 flex items-center gap-2">
                    <span className="text-2xl">
                      {sentimentEmojis[selectedRecording.sentiment || 'neutral']?.emoji || '😐'}
                    </span>
                    <span>{sentimentEmojis[selectedRecording.sentiment || 'neutral']?.label || 'Neutral'}</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Duracion</p>
                  <p className="mt-1">{formatDuration(selectedRecording.duration_seconds)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Idioma</p>
                  <p className="mt-1">{selectedRecording.language?.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Creado</p>
                  <p className="mt-1">{formatDate(selectedRecording.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Actualizado</p>
                  <p className="mt-1">{formatDate(selectedRecording.updated_at)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Habilidades Blandas Detectadas</p>
                <div className="flex flex-wrap gap-2">
                  {selectedRecording.soft_skills && selectedRecording.soft_skills.length > 0 ? (
                    selectedRecording.soft_skills.map((skill) => (
                      <Badge 
                        key={skill} 
                        variant="secondary" 
                        className={softSkillLabels[skill]?.color || 'bg-gray-100 text-gray-800'}
                      >
                        {softSkillLabels[skill]?.label || skill}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-sm">No se detectaron habilidades blandas</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Transcripcion</p>
                <div className="rounded-lg bg-muted p-4 max-h-64 overflow-y-auto">
                  <p className="whitespace-pre-wrap">{selectedRecording.transcription}</p>
                </div>
              </div>
              
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
