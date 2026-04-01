'use client'
import { useWebSerial } from '@/hooks/useWebSerial'

export default function WebSerialBar() {
    const { connectSerial, disconnectSerial, isSerialConnected, isConnecting, serialError } = useWebSerial()
    
    // Safety check for browser support inside the component
    const isSupported = typeof window !== 'undefined' && 'serial' in navigator

    if (!isSupported) {
        return (
            <div style={{ padding: '1rem', borderRadius: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '1rem' }}>
                <span style={{ color: '#f87171', fontSize: '0.75rem' }}>Web Serial is not supported in this browser. Use Chrome/Edge.</span>
            </div>
        )
    }

    return (
        <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '1rem', 
            borderRadius: '1rem', 
            background: 'rgba(255, 255, 255, 0.05)', 
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)',
            marginBottom: '1rem'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ 
                    padding: '0.5rem', 
                    borderRadius: '0.5rem', 
                    background: isSerialConnected ? 'rgba(0, 255, 149, 0.1)' : 'rgba(51, 65, 85, 0.3)',
                    color: isSerialConnected ? '#00ff95' : '#64748b'
                }}>
                    ⚡
                </div>
                <div>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white', margin: 0 }}>Direct Hardware Connection</h3>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                        {isSerialConnected ? 'ESP32 is connected via USB' : 'Connect your ESP32 directly to the browser (USB)'}
                    </p>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {serialError && (
                    <span style={{ fontSize: '0.75rem', color: '#f87171', background: 'rgba(248, 113, 113, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '0.375rem' }}>
                        {serialError}
                    </span>
                )}
                
                <button
                    onClick={isSerialConnected ? disconnectSerial : connectSerial}
                    disabled={isConnecting}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: isSerialConnected ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0, 255, 149, 0.1)',
                        border: isSerialConnected ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(0, 255, 149, 0.3)',
                        color: isSerialConnected ? '#f87171' : '#00ff95'
                    }}
                >
                    {isConnecting ? 'Connecting...' : isSerialConnected ? 'Disconnect ESP32' : '⚡ Connect Hardware'}
                </button>
            </div>
        </div>
    )
}
