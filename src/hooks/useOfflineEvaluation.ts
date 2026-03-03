import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'shodanavalia_offline_evaluations';

export interface OfflineEvaluation {
  temp_id: string;
  evaluation_data: Record<string, unknown>;
  candidate_name: string;
  target_grade: string;
  nota_final: number;
  status: string;
  created_at: string;
  sync_status: 'pending' | 'syncing' | 'synced' | 'error';
  sync_error?: string;
}

function readStorage(): OfflineEvaluation[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeStorage(evals: OfflineEvaluation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(evals));
}

export function useOfflineEvaluation() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const prevOnline = useRef(navigator.onLine);

  const updateCount = useCallback(() => {
    const pending = readStorage().filter(e => e.sync_status === 'pending' || e.sync_status === 'error');
    setPendingCount(pending.length);
  }, []);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    updateCount();
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [updateCount]);

  const syncPending = useCallback(async (): Promise<{ synced: number; errors: string[] }> => {
    setIsSyncing(true);
    const evals = readStorage();
    let synced = 0;
    const errors: string[] = [];

    for (const ev of evals) {
      if (ev.sync_status !== 'pending' && ev.sync_status !== 'error') continue;

      // Mark syncing
      ev.sync_status = 'syncing';
      writeStorage(evals);

      const { error } = await supabase.from('evaluations').insert([ev.evaluation_data as any]);

      if (error) {
        ev.sync_status = 'error';
        ev.sync_error = error.message;
        errors.push(`${ev.candidate_name}: ${error.message}`);
      } else {
        ev.sync_status = 'synced';
        synced++;
      }
      writeStorage(evals);
    }

    // Remove synced after delay
    setTimeout(() => {
      const current = readStorage().filter(e => e.sync_status !== 'synced');
      writeStorage(current);
      updateCount();
    }, 5000);

    updateCount();
    setIsSyncing(false);
    return { synced, errors };
  }, [updateCount]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && !prevOnline.current) {
      const timer = setTimeout(() => syncPending(), 2000);
      return () => clearTimeout(timer);
    }
    prevOnline.current = isOnline;
  }, [isOnline, syncPending]);

  const saveOffline = useCallback((data: OfflineEvaluation) => {
    const evals = readStorage();
    evals.push(data);
    writeStorage(evals);
    updateCount();
  }, [updateCount]);

  const getPendingEvaluations = useCallback((): OfflineEvaluation[] => {
    return readStorage().filter(e => e.sync_status !== 'synced');
  }, []);

  return {
    isOnline,
    pendingCount,
    saveOffline,
    syncPending,
    getPendingEvaluations,
    isSyncing,
  };
}
