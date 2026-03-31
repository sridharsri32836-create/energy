'use client'
import { use } from 'react'
import { motion } from 'framer-motion'
import { login, signup, signInWithGoogle } from './actions'

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const sp = use(searchParams)
  const error = sp?.error
  const message = sp?.message

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center p-3 bg-electric-blue/20 rounded-2xl border border-electric-blue/40 mb-4 shadow-lg shadow-electric-blue/20">
          <svg className="w-8 h-8 text-electric-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight uppercase">
          Grid<span className="text-electric-blue">Sense</span>
        </h2>
        <p className="mt-2 text-sm text-slate-400 font-medium">
          Secure access to your energy ecosystem
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/5 backdrop-blur-2xl py-10 px-6 shadow-2xl sm:rounded-3xl border border-white/10 relative overflow-hidden group">
          {/* Subtle glow effect */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-electric-blue/10 rounded-full blur-[100px] group-hover:bg-electric-blue/20 transition-colors duration-700" />
          
          <form className="space-y-6 relative z-10 text-left">
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Security ID (Email)
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="commander@gridsense.io"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-electric-blue/50 focus:ring-1 focus:ring-electric-blue/20 transition-all placeholder:text-slate-600 font-medium"
              />
            </div>

            <div>
              <label htmlFor="password" title="Password" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Access Key
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-electric-blue/50 focus:ring-1 focus:ring-electric-blue/20 transition-all placeholder:text-slate-600 font-medium"
              />
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-xs text-center font-bold bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                ⚠️ [CAUTION]: {error}
              </motion.div>
            )}
            
            {message && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-electric-blue text-xs text-center font-bold bg-electric-blue/10 p-3 rounded-xl border border-electric-blue/20">
                📫 [ACTION REQUIRED]: {message}
              </motion.div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-2">
              <button
                formAction={login}
                className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-lg text-sm font-bold text-white bg-electric-blue hover:bg-cyan-500 hover:scale-[1.02] transform transition-all active:scale-95 shadow-electric-blue/25"
              >
                Launch System
              </button>
              <button
                formAction={signup}
                className="w-full flex justify-center py-3.5 px-4 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-all active:scale-95"
              >
                Register Device
              </button>
            </div>
          </form>

          {/* External Auth Section - Moved Outside the Form to avoid validation interference */}
          <div className="mt-8 relative z-10">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-[#060c24] text-slate-500 font-medium tracking-tight">
                  External Authentication
                </span>
              </div>
            </div>

            <div className="mt-6">
              <form>
                <button
                  formAction={signInWithGoogle}
                  className="w-full flex justify-center items-center py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-all active:scale-95 group"
                >
                  <svg className="w-5 h-5 mr-3 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Connect with Google Identity
                </button>
              </form>
            </div>
          </div>
        </div>
        <p className="mt-8 text-center text-[10px] text-slate-600 uppercase tracking-widest animate-pulse">
          v1.4.0 • System Secure • Operational
        </p>
      </div>
    </div>
  )
}
