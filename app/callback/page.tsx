'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { exchangeToken } from '@/lib/spotify'
import { Suspense } from 'react'

function CallbackHandler() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code        = searchParams.get('code')
    const returnState = searchParams.get('state')
    const error       = searchParams.get('error')

    if (error || !code) {
      router.replace('/?error=access_denied')
      return
    }

    // Deduplicate by code — sessionStorage survives React Strict Mode double-mount
    if (sessionStorage.getItem('exchanged_code') === code) return
    sessionStorage.setItem('exchanged_code', code)

    const savedState = sessionStorage.getItem('oauth_state')
    const verifier   = sessionStorage.getItem('pkce_verifier')

    if (returnState !== savedState || !verifier) {
      router.replace('/?error=state_mismatch')
      return
    }

    exchangeToken(code, verifier)
      .then(token => {
        sessionStorage.setItem('spotify_token', token)
        sessionStorage.removeItem('pkce_verifier')
        sessionStorage.removeItem('oauth_state')
        sessionStorage.removeItem('exchanged_code')
        router.replace('/loading')
      })
      .catch(err => {
        console.error('[vibe-id] token exchange failed:', err.message)
        router.replace('/?error=token_failed')
      })
  }, [router, searchParams])

  return (
    <main className="min-h-screen flex items-center justify-center">
      <p
        className="text-sm tracking-[0.2em] uppercase opacity-40 cursor-blink"
        style={{ fontFamily: 'Courier New, monospace' }}
      >
        Authenticating
      </p>
    </main>
  )
}

export default function CallbackPage() {
  return (
    <Suspense>
      <CallbackHandler />
    </Suspense>
  )
}
