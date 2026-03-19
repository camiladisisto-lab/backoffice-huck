'use client'

import { useState } from 'react'
import { RecordingsTable } from '@/components/recordings-table'
import { UsersStatsTable } from '@/components/users-stats-table'
import { Mic, Users, FileAudio } from 'lucide-react'

export default function BackofficePage() {
  const [activeTab, setActiveTab] = useState<'recordings' | 'users'>('users')

  return (
    <div className="min-h-screen bg-background">
      {/* Header estilo Humand */}
      <header className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <Mic className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-foreground">
                  Backoffice
                </h1>
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
        <div className="flex gap-1 mb-8 p-1 bg-secondary/50 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'users'
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <Users className="h-4 w-4" />
            Usuarios
          </button>
          <button
            onClick={() => setActiveTab('recordings')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'recordings'
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <FileAudio className="h-4 w-4" />
            Grabaciones
          </button>
        </div>

        {/* Contenido del tab */}
        {activeTab === 'users' ? (
          <UsersStatsTable />
        ) : (
          <RecordingsTable />
        )}
      </div>
    </div>
  )
}
