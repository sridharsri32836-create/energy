'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
    Zap, LayoutDashboard, TrendingUp, Bell, FileText, Settings, Menu, X, Wifi, WifiOff
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const navLinks = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/energy', label: 'Energy Usage', icon: Zap },
    { href: '/predictions', label: 'Predictions', icon: TrendingUp },
    { href: '/alerts', label: 'Alerts', icon: Bell },
    { href: '/reports', label: 'Reports', icon: FileText },
    { href: '/settings', label: 'Settings', icon: Settings },
]

interface NavbarProps {
    isOnline?: boolean
    unreadAlerts?: number
}

export function Navbar({ isOnline = false, unreadAlerts = 0 }: NavbarProps) {
    const pathname = usePathname()
    const [mobileOpen, setMobileOpen] = useState(false)

    return (
        <nav className="sticky top-0 z-50 bg-white/5 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20 transition-all duration-300">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-electric-blue rounded-lg blur-md opacity-60 group-hover:opacity-90 transition-opacity" />
                            <div className="relative bg-electric-blue/20 border border-electric-blue/50 rounded-lg p-1.5">
                                <Zap className="w-5 h-5 text-electric-blue" />
                            </div>
                        </div>
                        <span className="flex items-center text-2xl font-black uppercase tracking-widest -skew-x-12 transition-all duration-300 group-hover:scale-105 group-hover:drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                            <span className="text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.85)] drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">GRID</span>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-blue to-cyan-300 drop-shadow-[0_0_12px_rgba(59,130,246,0.8)] ml-[2px]">SENSE</span>
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map(({ href, label, icon: Icon }) => {
                            const active = pathname === href
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${active
                                            ? 'text-red-300 bg-gradient-to-r from-red-500/10 to-rose-500/10 ring-1 ring-inset ring-red-400/30 shadow-md shadow-red-500/20 hover:from-red-400/15 hover:to-rose-400/15 hover:shadow-red-500/30'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
                                    {label === 'Alerts' && unreadAlerts > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-alert-orange text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                            {unreadAlerts > 9 ? '9+' : unreadAlerts}
                                        </span>
                                    )}
                                </Link>
                            )
                        })}
                    </div>

                    {/* Device Status */}
                    <div className="hidden md:flex items-center gap-3">
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border
              ${isOnline
                                ? 'bg-neon-green/10 border-neon-green/30 text-neon-green'
                                : 'bg-slate-800 border-slate-700 text-slate-400'
                            }`}
                        >
                            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                            {isOnline ? 'Device Online' : 'Device Offline'}
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
                    >
                        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden border-t border-white/10 bg-black/40 backdrop-blur-2xl shadow-xl shadow-black/50"
                    >
                        <div className="px-4 py-3 space-y-1">
                            {navLinks.map(({ href, label, icon: Icon }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    onClick={() => setMobileOpen(false)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                    ${pathname === href
                                            ? 'text-red-300 bg-gradient-to-r from-red-500/10 to-rose-500/10 ring-1 ring-inset ring-red-400/30 shadow-md shadow-red-500/20 hover:from-red-400/15 hover:to-rose-400/15 hover:shadow-red-500/30'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    )
}
