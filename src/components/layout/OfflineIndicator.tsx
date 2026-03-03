import { useState, useEffect } from 'react';
import { useOfflineEvaluation } from '@/hooks/useOfflineEvaluation';
import { WifiOff, Wifi, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function OfflineIndicator() {
  const { isOnline, pendingCount, syncPending, isSyncing } = useOfflineEvaluation();
  const [showOnlineBanner, setShowOnlineBanner] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    }
    if (isOnline && wasOffline) {
      setShowOnlineBanner(true);
      setWasOffline(false);
      // Auto-sync happens via the hook, show result
      const timer = setTimeout(() => {
        setShowOnlineBanner(false);
        setSyncResult(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  // Offline bar
  if (!isOnline) {
    return (
      <div className="sticky top-0 z-50 bg-yellow-600 text-white px-4 py-2 flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-2">
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">Modo Offline — As avaliações serão salvas localmente</span>
        </div>
        {pendingCount > 0 && (
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
            {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
          </span>
        )}
      </div>
    );
  }

  // Just came back online
  if (showOnlineBanner) {
    return (
      <div className="sticky top-0 z-50 bg-green-600 text-white px-4 py-2 flex items-center gap-2 animate-fade-in">
        <Wifi className="h-4 w-4" />
        <span className="text-sm font-medium">
          {isSyncing ? 'Conexão restaurada — Sincronizando...' : syncResult || 'Conexão restaurada'}
        </span>
      </div>
    );
  }

  // Online but has error pendencies
  if (pendingCount > 0) {
    return (
      <div className="sticky top-0 z-50 bg-red-600 text-white px-4 py-2 flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">
            {pendingCount} avaliação(ões) com erro de sincronização
          </span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="h-7 text-xs"
          onClick={async () => {
            const result = await syncPending();
            setSyncResult(`${result.synced} sincronizada(s)`);
          }}
          disabled={isSyncing}
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return null;
}
