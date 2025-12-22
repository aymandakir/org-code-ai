'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ScanProgress {
  isScanning: boolean;
  current: number;
  total: number;
  step: string;
}

export function useScanProgress() {
  const [progress, setProgress] = useState<ScanProgress>({
    isScanning: false,
    current: 0,
    total: 0,
    step: '',
  });

  useEffect(() => {
    const socketInstance = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('WebSocket connected');
    });

    socketInstance.on('org:scan:started', (data: { orgName: string }) => {
      setProgress({
        isScanning: true,
        current: 0,
        total: 0,
        step: `Starting scan of ${data.orgName}...`,
      });
    });

    socketInstance.on('org:scan:progress', (data: { current: number; total: number; step: string }) => {
      setProgress({
        isScanning: true,
        current: data.current,
        total: data.total,
        step: data.step,
      });
    });

    socketInstance.on('org:scan:completed', (data: { orgName: string; reposScanned: number; reposAnalyzed: number }) => {
      setProgress({
        isScanning: false,
        current: data.reposAnalyzed,
        total: data.reposScanned,
        step: 'Scan completed!',
      });
    });

    socketInstance.on('scan:started', (data: { orgName: string }) => {
      setProgress({
        isScanning: true,
        current: 0,
        total: 0,
        step: `Starting scan of ${data.orgName}...`,
      });
    });

    socketInstance.on('scan:progress', (data: { current: number; total: number; step?: string }) => {
      setProgress({
        isScanning: true,
        current: data.current,
        total: data.total,
        step: data.step || 'Processing...',
      });
    });

    socketInstance.on('scan:completed', () => {
      setProgress((prev) => ({
        isScanning: false,
        current: prev.total,
        total: prev.total,
        step: 'Scan completed!',
      }));
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return progress;
}

