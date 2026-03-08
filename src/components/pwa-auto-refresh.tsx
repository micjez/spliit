'use client'

import { useEffect } from 'react'

export function PwaAutoRefresh() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    const hadController = Boolean(navigator.serviceWorker.controller)
    let isRefreshing = false

    const onControllerChange = () => {
      if (!hadController || isRefreshing) return
      isRefreshing = true
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    return () => {
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        onControllerChange
      )
    }
  }, [])

  return null
}
