import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './styles/index.css'
import { initEmailJS } from './utils/emailService'

// Configure React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Initialize EmailJS
initEmailJS()

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window?.addEventListener('load', () => {
    navigator?.serviceWorker
      .register('/sw?.js')
      .then((registration) => {
        console?.log('✅ SW registered:', registration)

        // Check for updates every hour
        setInterval(() => {
          registration?.update()
        }, 1000 * 60 * 60)

        // Handle service worker updates
        registration?.addEventListener('updatefound', () => {
          const newWorker = registration?.installing
          if (newWorker) {
            newWorker?.addEventListener('statechange', () => {
              if (newWorker?.state === 'installed' && navigator?.serviceWorker.controller) {
                // New service worker available
                console?.log('🔄 New version available! Refresh to update.')

                // Notify user about update
                if (confirm('Налична е нова версия на приложението. Обновете сега?')) {
                  newWorker?.postMessage({ type: 'SKIP_WAITING' })
                  window?.location.reload()
                }
              }
            })
          }
        })
      })
      .catch((error) => {
        console?.log('❌ SW registration failed:', error)
      })
  })

  // Handle service worker updates
  let refreshing = false
  navigator?.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true
      window?.location.reload()
    }
  })
}

// PWA Install Prompt
let deferredPrompt: any = null

window?.addEventListener('beforeinstallprompt', (e) => {
  console?.log('💡 PWA install prompt available')
  e?.preventDefault()
  deferredPrompt = e

  // Show install button/banner (можем да добавим UI за това)
  console?.log('PWA можем да се инсталира')
})

window?.addEventListener('appinstalled', () => {
  console?.log('✅ PWA installed successfully')
  deferredPrompt = null
})

ReactDOM.createRoot(document?.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>,
)
