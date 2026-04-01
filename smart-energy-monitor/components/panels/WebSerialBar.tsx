'use client'
import { motion } from 'framer-motion'
import { Zap, RefreshCw } from 'lucide-react'
import { useWebSerial } from '@/hooks/useWebSerial'

export default function WebSerialBar() {
    const { connectSerial, disconnectSerial, isSerialConnected, isConnecting, serialError } = useWebSerial()
    
    // Safety check for browser support inside the component
    const isSupported = typeof window !== 'undefined' && 'serial' in navigator

    if (!isSupported) {
        return (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-red-500/5 border border-red-500/10 backdrop-blur-md">
                <div className="flex items-center gap-3 text-red-400">
                    <Zap className="w-5 h-5 opacity-50" />
                    <span className="text-xs">Web Serial is not supported in this browser. Use Chrome/Edge.</span>
                </div>
            </div>
        )
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md"
        >
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isSerialConnected ? 'bg-neon-green/10 text-neon-green' : 'bg-slate-700/30 text-slate-500'}`}>
                    <Zap className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-white">Direct Hardware Connection</h3>
                    <p className="text-xs text-slate-500">
                        {isSerialConnected ? 'ESP32 is connected via USB' : 'Connect your ESP32 directly to the browser (USB)'}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {serialError && (
                    <span className="text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded-md">
                        {serialError}
                    </span>
                )}
                
                <button
                    onClick={isSerialConnected ? disconnectSerial : connectSerial}
                    disabled={isConnecting}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        isSerialConnected 
                            ? 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20' 
                            : 'bg-neon-green/10 border border-neon-green/30 text-neon-green hover:bg-neon-green/20'
                    }`}
                >
                    {isConnecting ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : isSerialConnected ? (
                        <>Disconnect ESP32</>
                    ) : (
                        <>⚡ Connect Hardware</>
                    )}
                </button>
            </div>
        </motion.div>
    )
}
