'use client'

import { useUsersStats, type UserWithStats } from '@/hooks/use-users-stats'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import { Flame, Trophy, Clock, MessageSquare, ChevronRight } from 'lucide-react'

const sentimentEmojis: Record<string, { emoji: string; label: string }> = {
  positive: { emoji: '😊', label: 'Positivo' },
  negative: { emoji: '😔', label: 'Negativo' },
  neutral: { emoji: '😐', label: 'Neutral' }
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '-'
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  if (mins === 0) return `${secs}s`
  return `${mins}m ${secs}s`
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subvalue,
  className = ''
}: { 
  icon: React.ElementType
  label: string
  value: string | number
  subvalue?: string
  className?: string
}) {
  return (
    <div className={`flex items-center gap-4 p-5 rounded-2xl bg-white border border-border shadow-sm ${className}`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        {subvalue && <p className="text-xs text-muted-foreground mt-0.5">{subvalue}</p>}
      </div>
    </div>
  )
}

function UserStatsRow({ user }: { user: UserWithStats }) {
  const sentiment = sentimentEmojis[user.latest_sentiment] || sentimentEmojis.neutral

  return (
    <TableRow className="cursor-pointer hover:bg-muted/50 transition-colors">
      <TableCell>
        <Link href={`/usuario/${encodeURIComponent(user.user_identifier)}`} className="flex items-center gap-2">
          <span className="text-2xl" title={sentiment.label}>{sentiment.emoji}</span>
          <span className="font-medium text-primary hover:underline">{user.user_identifier}</span>
        </Link>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          <span className="font-semibold">{user.current_streak}</span>
          <span className="text-muted-foreground text-sm">dias</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          <span className="font-semibold">{user.max_streak}</span>
          <span className="text-muted-foreground text-sm">dias</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-500" />
          <span>{formatDuration(user.avg_duration)}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-emerald-500" />
          <span>{user.total_recordings}</span>
        </div>
      </TableCell>
      <TableCell>
        <Link href={`/usuario/${encodeURIComponent(user.user_identifier)}`}>
          <ChevronRight className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
        </Link>
      </TableCell>
    </TableRow>
  )
}

export function UsersStatsTable() {
  const { users, isLoading } = useUsersStats()

  // Calcular totales
  const totalRecordings = users.reduce((sum, u) => sum + u.total_recordings, 0)
  const avgDuration = users.length > 0 
    ? users.reduce((sum, u) => sum + (u.avg_duration || 0), 0) / users.length 
    : 0
  const maxStreak = users.length > 0 
    ? Math.max(...users.map(u => u.max_streak)) 
    : 0
  const activeUsers = users.filter(u => u.current_streak > 0).length

  return (
    <div className="space-y-8">
      {/* Resumen de estadisticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={MessageSquare} 
          label="Total Grabaciones" 
          value={totalRecordings}
        />
        <StatCard 
          icon={Clock} 
          label="Duracion Promedio" 
          value={formatDuration(avgDuration)}
        />
        <StatCard 
          icon={Trophy} 
          label="Record Maximo" 
          value={`${maxStreak} dias`}
        />
        <StatCard 
          icon={Flame} 
          label="Usuarios Activos" 
          value={activeUsers}
          subvalue={`de ${users.length} usuarios`}
        />
      </div>

      {/* Tabla de usuarios */}
      <div className="rounded-2xl border border-border bg-white shadow-sm">
        <div className="px-6 py-5 border-b border-border">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Estadisticas por Usuario</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Racha actual, record historico, duracion promedio y sentimiento de cada usuario
          </p>
        </div>
        <div className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Racha Actual</TableHead>
                <TableHead>Record</TableHead>
                <TableHead>Duracion Promedio</TableHead>
                <TableHead>Total Audios</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Cargando estadisticas...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay usuarios registrados
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <UserStatsRow key={user.user_identifier} user={user} />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
