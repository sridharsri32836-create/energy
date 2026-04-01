'use client'
import { useState, useEffect, useRef } from 'react'

interface WebSerialData {
    voltage: number
    current: number
    power: number
    energy: number
}

export function useWebSerial() {
    const [port, setPort] = useState<any | null>(null)
    const [isSerialConnected, setIsSerialConnected] = useState(false)
    const [serialError, setSerialError] = useState<string | null>(null)
    const [isConnecting, setIsConnecting] = useState(false)
    
    const portRef = useRef<any | null>(null)
    const readerRef = useRef<ReadableStreamDefaultReader | null>(null)
    const closedPromiseRef = useRef<Promise<void> | null>(null)

    // Auto-connect removed to prevent locking the COM port from Arduino IDE.
    // The user must manually click "Connect Hardware" to initiate the connection.

    const connectSerial = async () => {
        if (!('serial' in navigator)) {
            setSerialError('Web Serial API not supported in this browser. Use Chrome or Edge.')
            return
        }

        setIsConnecting(true)
        setSerialError(null)

        try {
            // 1. Request port selection
            const selectedPort = await (navigator as any).serial.requestPort()
            
            // 2. Open the port
            try {
                await selectedPort.open({ baudRate: 115200 })
            } catch (e: any) {
                 if (!e.message?.includes('already open') && e.name !== 'InvalidStateError') throw e
            }
            
            setPort(selectedPort)
            portRef.current = selectedPort
            setIsSerialConnected(true)
            setIsConnecting(false)

            // 3. Start reading
            readLoop(selectedPort)
        } catch (err: any) {
            console.error('Serial connection failed:', err)
            setSerialError(err.message || 'Failed to connect')
            setIsConnecting(false)
        }
    }

    const disconnectSerial = async () => {
        try {
            if (readerRef.current) {
                await readerRef.current.cancel()
                readerRef.current = null
            }
            if (closedPromiseRef.current) {
                await closedPromiseRef.current.catch(() => {})
                closedPromiseRef.current = null
            }
            if (portRef.current) {
                await portRef.current.close()
                portRef.current = null
                setPort(null)
            }
            setIsSerialConnected(false)
            // Zero out when manually disconnected
            syncToBackend({ voltage: 0, current: 0, power: 0, energy: 0 })
        } catch (err) {
            console.error('Disconnect failed:', err)
        }
    }

    const readLoop = async (activePort: any) => {
        try {
            const textDecoder = new TextDecoderStream()
            const readableStreamClosed = activePort.readable!.pipeTo(textDecoder.writable)
            closedPromiseRef.current = readableStreamClosed
            
            const reader = textDecoder.readable.getReader()
            readerRef.current = reader

            let buffer = ''
            let currentData: Partial<WebSerialData> = {}

            while (true) {
                const { value, done } = await reader.read()
                if (done) break
                
                buffer += value
                
                // Process complete lines
                if (buffer.includes('\n')) {
                    const lines = buffer.split('\n')
                    buffer = lines.pop() || '' // Keep the incomplete line for the next chunk

                    for (const line of lines) {
                        const text = line.trim()
                        if (!text) continue

                        if (text.startsWith('---')) {
                            // End of a data block
                            if (currentData.voltage !== undefined && currentData.power !== undefined) {
                                // Sync to backend
                                syncToBackend(currentData as WebSerialData)
                            }
                            currentData = {} // Reset for next block
                            continue
                        }

                        // Parse Label: ValueUnit
                        const match = text.match(/^([A-Za-z\s]+):\s*([0-9.]+|nan|NaN)/i)
                        if (match) {
                            const label = match[1].trim().toLowerCase()
                            let val = parseFloat(match[2])
                            if (isNaN(val)) val = 0

                            if (label === 'voltage') currentData.voltage = val
                            else if (label === 'current') currentData.current = val
                            else if (label === 'power') currentData.power = val
                            else if (label === 'energy') currentData.energy = val
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Serial read error:', err)
        } finally {
            if (readerRef.current) {
                readerRef.current.releaseLock()
            }
            setIsSerialConnected(false)
            // Zero out when connection is lost
            syncToBackend({ voltage: 0, current: 0, power: 0, energy: 0 })
        }
    }

    const syncToBackend = async (data: WebSerialData) => {
        try {
            await fetch('/api/readings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    voltage: data.voltage,
                    current: data.current,
                    power: data.power,
                    energy_kwh: data.energy || 0,
                    timestamp: new Date().toISOString()
                })
            })
        } catch (err) {
            console.error('Failed to sync serial data to cloud:', err)
        }
    }

    return {
        connectSerial,
        disconnectSerial,
        isSerialConnected,
        serialError,
        isConnecting
    }
}
