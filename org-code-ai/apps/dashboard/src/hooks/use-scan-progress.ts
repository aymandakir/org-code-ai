'use client';

import { useState } from 'react';

export interface ScanProgress {
  isScanning: boolean;
  current: number;
  total: number;
  step: string;
}

export function useScanProgress(): ScanProgress {
  const [progress] = useState<ScanProgress>({
    isScanning: false,
    current: 0,
    total: 0,
    step: '',
  });
  return progress;
}
