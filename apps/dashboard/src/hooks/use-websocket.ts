'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ScanProgress {
  current: number;
  total: number;
  repoName?: string;
  status: 'started' | 'scanning' | 'completed' | 'failed';
}

export function useWebSocket(scanId?: string, orgId?: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [vulnerabilities, setVulnerabilities] = useState<any[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Only connect in browser
    if (typeof window === 'undefined') return;

    const newSocket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      if (scanId) {
        newSocket.emit('join:scan', scanId);
      }
      if (orgId) {
        newSocket.emit('join:org', orgId);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    // Listen for scan events
    newSocket.on('scan:started', (data: { scanId: string; total: number }) => {
      setProgress({
        current: 0,
        total: data.total,
        status: 'started',
      });
    });

    newSocket.on('scan:progress', (data: { current: number; total: number; repoName?: string }) => {
      setProgress({
        current: data.current,
        total: data.total,
        repoName: data.repoName,
        status: 'scanning',
      });
    });

    newSocket.on('scan:vulnerability', (data: unknown) => {
      setVulnerabilities((prev) => [...prev, data]);
    });

    newSocket.on('scan:completed', (data: { scanId: string; summary: unknown }) => {
      setProgress((prev) => (prev ? { ...prev, status: 'completed' } : null));
    });

    return () => {
      newSocket.close();
    };
  }, [scanId, orgId]);

  return {
    socket,
    progress,
    vulnerabilities,
    isConnected: socket?.connected || false,
  };
}

