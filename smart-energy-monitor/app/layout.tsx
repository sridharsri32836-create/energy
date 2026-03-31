import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import ShaderBackground from '@/components/ui/shader-background'

export const metadata: Metadata = {
  title: 'Smart Energy Monitor | Real-time Electricity Dashboard',
  description:
    'Monitor real-time voltage, current, power usage, costs, and get AI-powered predictions for your home electricity consumption with Smart Energy Monitor.',
  keywords: ['energy monitor', 'smart meter', 'electricity dashboard', 'IoT', 'ESP32', 'PZEM'],
  openGraph: {
    title: 'Smart Energy Monitor',
    description: 'Real-time household electricity monitoring dashboard',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased min-h-screen">
        <ShaderBackground />
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#060c24',
              color: '#e2e8f0',
              border: '1px solid rgba(59,130,246,0.3)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#4ade80', secondary: '#060c24' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#060c24' } },
          }}
        />
      </body>
    </html>
  )
}
