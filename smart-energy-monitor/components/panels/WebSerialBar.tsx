'use client'
import { useWebSerial } from '@/hooks/useWebSerial'
import { Zap, Wifi, WifiOff, AlertCircle, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function WebSerialBar() {
    const { connectSerial, disconnectSerial, isSerialConnected, isConnecting, serialError } = useWebSerial()
    
    // Safety check for browser support inside the component
    const isSupported = typeof window !== 'undefined' && 'serial' in navigator

    if (!isSupported) {
        return (
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-alert-red/10 border border-alert-red/20 mb-6"
            >
                <AlertCircle className="w-5 h-5 text-alert-red" />
                <span className="text-alert-red text-sm font-medium">
                    Web Serial is not supported in this browser. Please use Google Chrome or Microsoft Edge for direct hardware connection.
                </span>
            </motion.div>
        )
    }

    return (
        <div className="relative group overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 mb-8 transition-all duration-300 hover:bg-white/8 shadow-2xl shadow-black/40">
            {/* Animated background gradient when connected */}
            <AnimatePresence>
                {isSerialConnected && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-gradient-to-r from-neon-green/5 via-electric-blue/5 to-neon-green/5 bg-[length:200%_100%] animate-[gradient_3s_linear_infinite] pointer-events-none"
                    />
                )}
            </AnimatePresence>

            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className={`relative p-3 rounded-xl transition-all duration-500 ${
                        isSerialConnected 
                        ? 'bg-neon-green/20 text-neon-green shadow-[0_0_20px_rgba(74,222,128,0.3)]' 
                        : 'bg-slate-800/50 text-slate-500'
                    }`}>
                        {isSerialConnected ? (
                            <Zap className="w-5 h-5 animate-pulse" />
                        ) : (
                            <WifiOff className="w-5 h-5" />
                        )}
                        {isSerialConnected && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-neon-green"></span>
                            </span>
                        )}
                    </div>
                    
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Direct Hardware Link</h3>
                            {isSerialConnected && (
                                <span className="text-[10px] bg-neon-green/10 text-neon-green px-2 py-0.5 rounded-full border border-neon-green/20 font-bold animate-pulse">
                                    LIVE
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {isSerialConnected 
                                ? 'USB Port Active · Latency < 10ms' 
                                : 'Connect your ESP32 directly to the dashboard via USB cable'
                            }
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto">
                    {serialError && (
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-alert-red/10 border border-alert-red/20 text-alert-red text-xs font-medium"
                        >
                            <AlertCircle className="w-3.5 h-3.5" />
                            {serialError}
                        </motion.div>
                    )}
                    
                    <button
                        onClick={isSerialConnected ? disconnectSerial : connectSerial}
                        disabled={isConnecting}
                        className={`flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 transform active:scale-95 ${
                            isSerialConnected 
                            ? 'bg-alert-red/10 border border-alert-red/30 text-alert-red hover:bg-alert-red/20' 
                            : 'bg-electric-blue border border-electric-blue/50 text-white hover:bg-electric-blue-light hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isConnecting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Scanning...</span>
                            </>
                        ) : isSerialConnected ? (
                            <>
                                <Wifi className="w-4 h-4" />
                                <span>Disconnect Hardware</span>
                            </>
                        ) : (
                            <>
                                <Zap className="w-4 h-4" />
                                <span>Connect Hardware</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
            
            {/* Show error on mobile below button */}
            {serialError && (
                <div className="mt-3 flex md:hidden items-center gap-1.5 px-3 py-1.5 rounded-lg bg-alert-red/10 border border-alert-red/20 text-alert-red text-xs font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {serialError}
                </div>
            )}
        </div>
    )
}

