'use client'

import { useState } from 'react'
import { Download, Database } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function AdminBackup() {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<{
    exportedAt: string
    counts: Record<string, number>
  } | null>(null)

  const loadPreview = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/backup')
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar preview do backup')
      }

      const counts: Record<string, number> = {}
      const entries = Object.entries(data?.data || {})
      for (const [key, value] of entries) {
        counts[key] = Array.isArray(value) ? value.length : 0
      }

      setPreview({
        exportedAt: data?.meta?.exportedAt || new Date().toISOString(),
        counts,
      })
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar backup',
        description: error?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const downloadBackup = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/backup?download=1')
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao baixar backup')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `carolsol-backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(url)

      toast({
        title: 'Backup exportado',
        description: 'Arquivo JSON baixado com sucesso.',
      })
    } catch (error: any) {
      toast({
        title: 'Erro ao baixar backup',
        description: error?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
        <h2 className="font-display font-bold text-xl text-foreground">
          Backup do Banco
        </h2>
        <p className="text-sm text-muted-foreground">
          Gere e baixe um backup completo em JSON para seguranca e restauracao.
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadPreview}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-pink-200 text-foreground font-semibold inline-flex items-center gap-2 disabled:opacity-60"
          >
            <Database className="w-4 h-4" />
            Ver resumo
          </button>
          <button
            type="button"
            onClick={downloadBackup}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-primary text-white font-semibold inline-flex items-center gap-2 disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            Baixar backup
          </button>
        </div>
      </div>

      {preview && (
        <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Ultima geracao: {new Date(preview.exportedAt).toLocaleString('pt-BR')}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(preview.counts).map(([key, value]) => (
              <div
                key={key}
                className="border border-pink-100 rounded-xl p-3 bg-pink-50/40"
              >
                <p className="text-xs text-muted-foreground">{key}</p>
                <p className="font-bold text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

