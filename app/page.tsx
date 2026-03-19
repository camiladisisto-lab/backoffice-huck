'use client'

import { useState } from 'react'
import { RecordingsTable } from '@/components/recordings-table'
import { UsersStatsTable } from '@/components/users-stats-table'
import { TalentGrowthTable } from '@/components/talent-growth-table'
import { Mic, Users, FileAudio, TrendingUp } from 'lucide-react'

export default function BackofficePage() {
  const [activeTab, setActiveTab] = useState<'recordings' | 'users' | 'talent'>('users')

  return (
    <div className="min-h-screen bg-background">
      {/* Header estilo Humand */}
      <header className="border-b border-border bg-white">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                <Mic className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold tracking-tight text-foreground">
                    Backoffice
                  </h1>
                  <img
                    src="/humand-logo.png"
                    alt="Humand"
                    className="h-6"
                    style={{ width: 'auto', height: 'auto', maxHeight: '24px' }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Gestion de transcripciones de voz
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Tabs de navegacion estilo Humand */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
              activeTab === 'users'
                ? 'bg-primary text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <Users className="h-4 w-4" />
            Usuarios
          </button>
          <button
            onClick={() => setActiveTab('recordings')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
              activeTab === 'recordings'
                ? 'bg-primary text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <FileAudio className="h-4 w-4" />
            Grabaciones
          </button>
          <button
            onClick={() => setActiveTab('talent')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
              activeTab === 'talent'
                ? 'bg-primary text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            Talento en Crecimiento
          </button>
        </div>

        {/* Contenido del tab */}
        {activeTab === 'users' && <UsersStatsTable />}
        {activeTab === 'recordings' && <RecordingsTable />}
        {activeTab === 'talent' && <TalentGrowthTable />}
      </div>
    </div>
  )
}
