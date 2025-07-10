import { useOffline } from '@/hooks/useOffline';
import { Wifi, WifiOff, Cloud, CloudOff } from 'lucide-react';

export function OfflineIndicator() {
  const { isOnline, isOffline } = useOffline();

  if (isOnline) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-900/20 border border-green-500/30">
        <Wifi className="w-4 h-4 text-green-400" />
        <span className="text-green-300 text-sm font-medium">Online</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-orange-900/20 border border-orange-500/30">
      <WifiOff className="w-4 h-4 text-orange-400" />
      <span className="text-orange-300 text-sm font-medium">Offline</span>
    </div>
  );
}

export function DataSyncIndicator({ showSync = false }: { showSync?: boolean }) {
  const { isOnline } = useOffline();

  if (!showSync) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/20 border border-blue-500/30">
      <Cloud className="w-4 h-4 text-blue-400 animate-pulse" />
      <span className="text-blue-300 text-sm font-medium">Syncing...</span>
    </div>
  );
}

export function OfflineBanner() {
  const { isOffline } = useOffline();

  if (!isOffline) return null;

  return (
    <div className="bg-orange-600 text-white p-3 text-center">
      <div className="flex items-center justify-center gap-2">
        <CloudOff className="w-5 h-5" />
        <span className="font-medium">
          You are currently offline. Changes will be saved locally and synced when you reconnect.
        </span>
      </div>
    </div>
  );
}