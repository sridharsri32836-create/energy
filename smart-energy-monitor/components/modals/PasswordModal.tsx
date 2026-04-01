'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, X, Delete, ShieldAlert } from 'lucide-react'

interface PasswordModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    title?: string
    description?: string
}

const CORRECT_PIN = '777'

export function PasswordModal({ isOpen, onClose, onSuccess, title = 'Security Check', description = 'Enter the security PIN to continue' }: PasswordModalProps) {
    const [pin, setPin] = useState('')
    const [shake, setShake] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setPin('')
            setError('')
            setSuccess(false)
            setShake(false)
        }
    }, [isOpen])

    const handleDigit = useCallback((digit: string) => {
        if (pin.length >= CORRECT_PIN.length) return
        const next = pin + digit
        setPin(next)
        setError('')

        if (next.length === CORRECT_PIN.length) {
            if (next === CORRECT_PIN) {
                setSuccess(true)
                setTimeout(() => {
                    onSuccess()
                    onClose()
                }, 400)
            } else {
                setShake(true)
                setError('Incorrect PIN')
                setTimeout(() => {
                    setPin('')
                    setShake(false)
                }, 600)
            }
        }
    }, [pin, onSuccess, onClose])

    const handleDelete = useCallback(() => {
        setPin(p => p.slice(0, -1))
        setError('')
    }, [])

    // Keyboard support
    useEffect(() => {
        if (!isOpen) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key >= '0' && e.key <= '9') handleDigit(e.key)
            if (e.key === 'Backspace') handleDelete()
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [isOpen, handleDigit, handleDelete, onClose])

    const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    {/* Modal */}
                    <motion.div
                        className="relative z-10 bg-[#0d1526] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 p-6 w-80 flex flex-col items-center gap-5"
                        initial={{ scale: 0.85, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.85, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    >
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Icon + title */}
                        <div className="flex flex-col items-center gap-2">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${success ? 'bg-neon-green/20' : 'bg-electric-blue/10'} transition-colors duration-300`}>
                                {success ? (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500 }}>
                                        <ShieldAlert className="w-6 h-6 text-neon-green" />
                                    </motion.div>
                                ) : (
                                    <Lock className="w-6 h-6 text-electric-blue" />
                                )}
                            </div>
                            <h2 className="text-slate-200 font-semibold text-base">{title}</h2>
                            <p className="text-slate-500 text-xs text-center">{description}</p>
                        </div>

                        {/* PIN dots */}
                        <motion.div
                            className="flex items-center gap-3"
                            animate={shake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            {Array.from({ length: CORRECT_PIN.length }).map((_, i) => (
                                <motion.div
                                    key={i}
                                    className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${i < pin.length
                                        ? success
                                            ? 'bg-neon-green border-neon-green'
                                            : shake
                                                ? 'bg-alert-red border-alert-red'
                                                : 'bg-electric-blue border-electric-blue'
                                        : 'border-white/20 bg-transparent'
                                        }`}
                                    animate={{ scale: i === pin.length - 1 ? [1, 1.3, 1] : 1 }}
                                    transition={{ duration: 0.15 }}
                                />
                            ))}
                        </motion.div>

                        {/* Error message */}
                        <AnimatePresence>
                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="text-alert-red text-xs -mt-2"
                                >
                                    {error}
                                </motion.p>
                            )}
                        </AnimatePresence>

                        {/* PIN pad */}
                        <div className="grid grid-cols-3 gap-2.5 w-full">
                            {digits.map((d, i) => {
                                if (d === '') return <div key={i} />
                                if (d === 'del') return (
                                    <motion.button
                                        key="del"
                                        whileTap={{ scale: 0.9 }}
                                        onClick={handleDelete}
                                        disabled={pin.length === 0}
                                        className="h-12 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <Delete className="w-4 h-4" />
                                    </motion.button>
                                )
                                return (
                                    <motion.button
                                        key={d}
                                        whileTap={{ scale: 0.88 }}
                                        onClick={() => handleDigit(d)}
                                        className="h-12 rounded-xl bg-white/5 border border-white/8 text-slate-200 font-semibold text-lg hover:bg-electric-blue/20 hover:border-electric-blue/30 hover:text-white transition-all"
                                    >
                                        {d}
                                    </motion.button>
                                )
                            })}
                        </div>

                        <p className="text-slate-600 text-[10px]">Protected action • GridSense Security</p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
