'use client'

import { useState } from 'react'
import { useRecordings, updateRecording, deleteRecording } from '@/hooks/use-recordings'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { MoreHorizontal, Search, ChevronLeft, ChevronRight, Eye, CheckCircle, Archive, Trash2 } from 'lucide-react'

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  reviewed: 'bg-primary/20 text-primary border-primary/30',
  archived: 'bg-muted text-muted-foreground border-border'
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  reviewed: 'Revisado',
  archived: 'Archivado'
}

const sentimentEmojis: Record<string, { emoji: string; label: string }> = {
  positive: { emoji: '😊', label: 'Positivo' },
  negative: { emoji: '😔', label: 'Negativo' },
  neutral: { emoji: '😐', label: 'Neutral' }
}

const softSkillLabels: Record<string, { label: string; color: string }> = {
  comunicacion_efectiva: { label: 'Comunicacion Efectiva', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  escucha_activa: { label: 'Escucha Activa', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  trabajo_en_equipo: { label: 'Trabajo en Equipo', color: 'bg-primary/20 text-primary border-primary/30' },
  empatia: { label: 'Empatia', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  adaptabilidad: { label: 'Adaptabilidad', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  gestion_del_tiempo: { label: 'Gestion del Tiempo', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  responsabilidad: { label: 'Responsabilidad', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  pensamiento_critico: { label: 'Pensamiento Critico', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' }
}

export function RecordingsTable() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null)

  const { recordings, pagination, isLoading, mutate } = useRecordings({
    page,
    limit: 10,
    status,
    search
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    await updateRecording(id, { status: newStatus as Recording['status'] })
    mutate()
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por usuario o transcripción..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">Buscar</Button>
        </form>

        <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1) }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="reviewed">Revisado</SelectItem>
            <SelectItem value="archived">Archivado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">Sentimiento</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead className="hidden md:table-cell">Transcripcion</TableHead>
              <TableHead className="hidden lg:table-cell">Habilidades</TableHead>
              <TableHead className="hidden sm:table-cell">Duracion</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="hidden lg:table-cell">Fecha</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Cargando grabaciones...
                </TableCell>
              </TableRow>
            ) : recordings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
                  <TableCell>
                    <Badge variant="outline" className={statusColors[recording.status]}>
                      {statusLabels[recording.status]}
                    </Badge>
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
                        <DropdownMenuItem onClick={() => handleStatusChange(recording.id, 'reviewed')}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Marcar revisado
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(recording.id, 'archived')}>
                          <Archive className="h-4 w-4 mr-2" />
                          Archivar
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
                  <p className="text-sm font-medium text-muted-foreground">Estado</p>
                  <Badge variant="outline" className={`mt-1 ${statusColors[selectedRecording.status]}`}>
                    {statusLabels[selectedRecording.status]}
                  </Badge>
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
              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    handleStatusChange(selectedRecording.id, 'reviewed')
                    setSelectedRecording(null)
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marcar revisado
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleStatusChange(selectedRecording.id, 'archived')
                    setSelectedRecording(null)
                  }}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archivar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
