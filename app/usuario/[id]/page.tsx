'use client'

import { useState, use } from 'react'
import { useUsersStats } from '@/hooks/use-users-stats'
import { RecordingsTable } from '@/components/recordings-table'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  FileText, 
  Award, 
  Send, 
  Loader2, 
  Flame, 
  Trophy, 
  Clock, 
  MessageSquare,
  Copy,
  Check
} from 'lucide-react'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
  const [letter, setLetter] = useState<string | null>(null)
  const [isLoadingReport, setIsLoadingReport] = useState(false)
  const [isLoadingLetter, setIsLoadingLetter] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [showLetterDialog, setShowLetterDialog] = useState(false)
  const [showNotifyDialog, setShowNotifyDialog] = useState(false)
  const [notifyUrl, setNotifyUrl] = useState('https://humand-ascend-mvp-nu.vercel.app/api/webhook')
  const [isNotifying, setIsNotifying] = useState(false)
  const [notifyResult, setNotifyResult] = useState<{ success: boolean; message: string } | null>(null)
  const [lastQuestion, setLastQuestion] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const sentiment = user ? (sentimentEmojis[user.latest_sentiment] || sentimentEmojis.neutral) : sentimentEmojis.neutral

  const generateReport = async () => {
    setIsLoadingReport(true)
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(userId)}/report`)
      const data = await response.json()
      if (data.error) {
        alert(data.error)
      } else {
        setReport(data.report)
        setShowReportDialog(true)
      }
    } catch (error) {
      alert('Error generando reporte')
    } finally {
      setIsLoadingReport(false)
    }
  }

  const generateLetter = async () => {
    if (!report) {
      alert('Primero debes generar el reporte')
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
    setNotifyResult(null)
    setLastQuestion(null)
    try {
      const response = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: notifyUrl
        })
      })
      const data = await response.json()
      if (data.success) {
        setLastQuestion(data.question)
        setNotifyResult({
          success: true,
          message: 'Pregunta enviada exitosamente'
        })
      } else {
        setNotifyResult({
          success: false,
          message: data.error || 'Error enviando notificacion'
        })
      }
    } catch (error) {
      setNotifyResult({
        success: false,
        message: 'Error enviando notificacion'
      })
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

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={generateReport} 
            disabled={isLoadingReport}
            className="gap-2"
          >
            {isLoadingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Generar Reporte con IA
          </Button>
          <Button 
            onClick={generateLetter} 
            disabled={isLoadingLetter || !report}
            variant="outline"
            className="gap-2"
          >
            {isLoadingLetter ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
            Generar Carta de Recomendacion
          </Button>
          <Button 
            onClick={() => setShowNotifyDialog(true)} 
            variant="outline"
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            Enviar Notificacion
          </Button>
        </div>

        {/* Recordings Table */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Grabaciones de {userId}</h2>
          <RecordingsTable userId={userId} />
        </div>
      </div>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reporte de {userId}</DialogTitle>
            <DialogDescription>
              Analisis generado con IA basado en todas las grabaciones
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="flex justify-end mb-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => copyToClipboard(report || '')}
                className="gap-2"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
            <div className="rounded-lg bg-muted p-6 whitespace-pre-wrap text-sm">
              {report}
            </div>
          </div>
        </DialogContent>
      </Dialog>

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

      {/* Notify Dialog */}
      <Dialog open={showNotifyDialog} onOpenChange={(open) => {
        setShowNotifyDialog(open)
        if (!open) {
          setNotifyResult(null)
          setLastQuestion(null)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Pregunta de Reflexion</DialogTitle>
            <DialogDescription>
              Envia una pregunta aleatoria a la otra aplicacion via webhook
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="notifyUrl">URL de destino (webhook)</Label>
              <Input
                id="notifyUrl"
                value={notifyUrl}
                onChange={(e) => setNotifyUrl(e.target.value)}
                placeholder="https://otra-app.vercel.app/api/webhook"
              />
            </div>
            {lastQuestion && (
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-xs text-blue-600 font-medium mb-1">Pregunta enviada:</p>
                <p className="text-sm text-blue-900">{lastQuestion}</p>
              </div>
            )}
            {notifyResult && (
              <div className={`p-3 rounded-lg text-sm ${
                notifyResult.success 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {notifyResult.message}
              </div>
            )}
            <Button 
              onClick={sendNotification} 
              disabled={isNotifying || !notifyUrl}
              className="w-full gap-2"
            >
              {isNotifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar Pregunta Aleatoria
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
