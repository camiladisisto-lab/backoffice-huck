'use client'

import { useState, useEffect, use } from 'react'
import { useUsersStats } from '@/hooks/use-users-stats'
import { RecordingsTable } from '@/components/recordings-table'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  Award, 
  Send, 
  Loader2, 
  Flame, 
  Trophy, 
  Clock, 
  MessageSquare,
  Copy,
  Check,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { SoftSkillsRadar } from '@/components/soft-skills-radar'

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

export default function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const userId = decodeURIComponent(id)
  const { users } = useUsersStats()
  const user = users.find(u => u.user_identifier === userId)

  const [report, setReport] = useState<string | null>(null)
  const [reportLoading, setReportLoading] = useState(true)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [letter, setLetter] = useState<string | null>(null)
  const [isLoadingLetter, setIsLoadingLetter] = useState(false)
  const [showLetterDialog, setShowLetterDialog] = useState(false)
  const [notifyUrl] = useState('https://humand-ascend-mvp-nu.vercel.app/api/webhook')
  const [isNotifying, setIsNotifying] = useState(false)
  const [copied, setCopied] = useState(false)

  const sentiment = user ? (sentimentEmojis[user.latest_sentiment] || sentimentEmojis.neutral) : sentimentEmojis.neutral

  // Fetch existing report on mount
  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(`/api/users/${encodeURIComponent(userId)}/report`)
        const data = await response.json()
        if (data.report) {
          setReport(data.report)
        } else {
          // No report exists, generate one automatically
          await regenerateReport()
        }
      } catch (error) {
        console.error('Error fetching report:', error)
      } finally {
        setReportLoading(false)
      }
    }
    fetchReport()
  }, [userId])

  const regenerateReport = async () => {
    setIsRegenerating(true)
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(userId)}/report`, {
        method: 'POST'
      })
      const data = await response.json()
      if (data.error) {
        console.error(data.error)
      } else {
        setReport(data.report)
      }
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setIsRegenerating(false)
      setReportLoading(false)
    }
  }

  const generateLetter = async () => {
    if (!report) {
      alert('No hay reporte disponible')
      return
    }
    setIsLoadingLetter(true)
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(userId)}/recommendation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report })
      })
      const data = await response.json()
      if (data.error) {
        alert(data.error)
      } else {
        setLetter(data.letter)
        setShowLetterDialog(true)
      }
    } catch (error) {
      alert('Error generando carta')
    } finally {
      setIsLoadingLetter(false)
    }
  }

  const sendNotification = async () => {
    setIsNotifying(true)
    try {
      const response = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: notifyUrl
        })
      })
      const data = await response.json()
      if (!data.success) {
        console.error('Error enviando notificacion:', data.error)
      }
    } catch (error) {
      console.error('Error enviando notificacion:', error)
    } finally {
      setIsNotifying(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-white">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{sentiment.emoji}</span>
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-foreground">
                  {userId}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Perfil y grabaciones del usuario
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Stats Cards */}
        {user && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-border shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500">
                <Flame className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight">{user.current_streak}</p>
                <p className="text-sm text-muted-foreground">Racha Actual</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-border shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight">{user.max_streak}</p>
                <p className="text-sm text-muted-foreground">Record</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-border shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight">{formatDuration(user.avg_duration)}</p>
                <p className="text-sm text-muted-foreground">Duracion Promedio</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-border shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight">{user.total_recordings}</p>
                <p className="text-sm text-muted-foreground">Total Grabaciones</p>
              </div>
            </div>
          </div>
        )}

        {/* AI Report Section - Resumen del Perfil */}
        <div className="rounded-2xl bg-white border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Resumen del Perfil</h2>
              <p className="text-sm text-muted-foreground">Analisis generado con IA basado en las grabaciones</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={regenerateReport}
                disabled={isRegenerating || reportLoading}
                className="gap-2"
              >
                {isRegenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Regenerar
              </Button>
              {report && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => copyToClipboard(report)}
                  className="gap-2"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </Button>
              )}
            </div>
          </div>
          <div className="p-6">
            {reportLoading || isRegenerating ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-3" />
                <span>{isRegenerating ? 'Generando resumen con IA...' : 'Cargando resumen...'}</span>
              </div>
            ) : report ? (
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground">
                {report}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No se pudo generar el resumen. Asegurate de que el usuario tenga grabaciones.</p>
                <Button 
                  variant="outline" 
                  onClick={regenerateReport}
                  className="mt-4 gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Intentar de nuevo
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Soft Skills Radar Chart */}
        <SoftSkillsRadar userId={userId} />

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={generateLetter} 
            disabled={isLoadingLetter || !report}
            className="gap-2"
          >
            {isLoadingLetter ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
            Generar Carta de Recomendacion
          </Button>
          <Button 
            onClick={sendNotification} 
            disabled={isNotifying}
            variant="outline"
            className="gap-2"
          >
            {isNotifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {isNotifying ? 'Enviando...' : 'Enviar Notificacion'}
          </Button>
        </div>

        {/* Recordings Table */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Grabaciones de {userId}</h2>
          <RecordingsTable userId={userId} />
        </div>
      </div>

      {/* Letter Dialog */}
      <Dialog open={showLetterDialog} onOpenChange={setShowLetterDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Carta de Recomendacion</DialogTitle>
            <DialogDescription>
              Carta generada para compartir con {userId}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="flex justify-end mb-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => copyToClipboard(letter || '')}
                className="gap-2"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
            <div className="rounded-lg bg-muted p-6 whitespace-pre-wrap text-sm font-serif">
              {letter}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      
    </div>
  )
}
