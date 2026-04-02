'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { parseSpotifyExport, ExportParseError } from '@/lib/exportParser'

type Stage = 'idle' | 'parsing' | 'error' | 'ready'

export default function UploadPage() {
  const router = useRouter()
  const [stage,   setStage]   = useState<Stage>('idle')
  const [error,   setError]   = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const processFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.zip')) {
      setError('Please upload the ZIP file Spotify sent you — not an extracted file.')
      setStage('error')
      return
    }

    setStage('parsing')
    setError(null)

    try {
      const payload = await parseSpotifyExport(file)
      sessionStorage.setItem('export_payload', JSON.stringify(payload))
      setStage('ready')
      // Small pause so "ready" state is visible before redirect
      setTimeout(() => router.push('/loading'), 600)
    } catch (err) {
      setError(err instanceof ExportParseError ? err.message : 'Something went wrong reading the file. Please try again.')
      setStage('error')
    }
  }, [router])

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const isProcessing = stage === 'parsing' || stage === 'ready'

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-lg w-full">

        <p className="text-xs tracking-[0.3em] uppercase mb-10 opacity-40"
          style={{ fontFamily: 'Courier New, monospace' }}>
          VIBE-ID · DATA UPLOAD
        </p>

        <h1 className="text-3xl sm:text-4xl font-bold mb-3 leading-tight"
          style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}>
          Upload your Spotify data.
        </h1>

        <p className="text-sm mb-10 opacity-50 leading-6"
          style={{ fontFamily: 'Courier New, monospace' }}>
          Parsed entirely in your browser. Nothing is stored or sent anywhere.
        </p>

        {/* Drop zone */}
        <label
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className="block w-full border border-dashed transition-colors cursor-pointer mb-6"
          style={{
            borderColor: dragging ? '#f0ede6' : stage === 'error' ? '#e05c5c' : stage === 'ready' ? '#7a9e7e' : '#2a2a2a',
            padding: '3rem 2rem',
            textAlign: 'center',
          }}>
          <input
            type="file"
            accept=".zip"
            className="sr-only"
            onChange={onFileInput}
            disabled={isProcessing}
          />

          <div style={{ fontFamily: 'Courier New, monospace' }}>
            {stage === 'idle' && (
              <>
                <p className="text-sm opacity-60 mb-2">drop your ZIP here</p>
                <p className="text-xs opacity-30">or click to browse</p>
              </>
            )}
            {stage === 'parsing' && (
              <p className="text-sm opacity-60">reading your history...</p>
            )}
            {stage === 'ready' && (
              <p className="text-sm" style={{ color: '#7a9e7e' }}>data loaded — starting audit</p>
            )}
            {stage === 'error' && (
              <>
                <p className="text-sm mb-2" style={{ color: '#e05c5c' }}>could not read file</p>
                <p className="text-xs opacity-50">click to try again</p>
              </>
            )}
          </div>
        </label>

        {/* Error message */}
        {error && (
          <p className="text-xs mb-6 leading-5 opacity-70" style={{ fontFamily: 'Courier New, monospace', color: '#e05c5c' }}>
            {error}
          </p>
        )}

        {/* How to get the file */}
        <div className="border border-[#1a1a1a] px-5 py-4 mb-8">
          <p className="text-xs tracking-[0.2em] uppercase opacity-30 mb-3"
            style={{ fontFamily: 'Courier New, monospace' }}>
            how to get your data
          </p>
          <ol className="space-y-2 text-xs opacity-50 list-none"
            style={{ fontFamily: 'Courier New, monospace' }}>
            <li>1. spotify.com → Account → Privacy settings</li>
            <li>2. Request <span className="opacity-100" style={{ color: '#f0ede6' }}>"Extended streaming history"</span></li>
            <li>3. Spotify emails a ZIP in a few days (up to 30)</li>
            <li>4. Upload that ZIP here</li>
          </ol>
          <p className="text-xs mt-3 opacity-30" style={{ fontFamily: 'Courier New, monospace' }}>
            not the "Account data" option — that one won't work
          </p>
        </div>

        <button
          onClick={() => router.push('/')}
          className="text-xs opacity-25 hover:opacity-50 transition-opacity tracking-widest uppercase"
          style={{ fontFamily: 'Courier New, monospace' }}>
          ← back
        </button>
      </div>
    </main>
  )
}
