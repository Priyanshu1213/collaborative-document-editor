import { syncQueueDB, documentDB } from '@/utils/indexedDB';
import api from './api';
import toast from 'react-hot-toast';

class SyncService {
  private syncing = false;
  private syncInterval: NodeJS.Timeout | null = null;

  startAutoSync(intervalMs: number = 5000): void {
    if (this.syncInterval) return;

    // Disabled - using manual save instead
    // this.syncInterval = setInterval(() => {
    //   this.syncUnsyncedChanges();
    // }, intervalMs);
 

    // Also sync when coming back online
    window.addEventListener('online', () => {
      this.syncUnsyncedChanges();
    });
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async syncUnsyncedChanges(): Promise<void> {
    if (this.syncing || !navigator.onLine) return;

    this.syncing = true;
    try {
      const items = await syncQueueDB.getUnsyncedItems();
      
      if (!items || items.length === 0) {
        this.syncing = false;
        return;
      }

      for (const item of items) {
        try {
          switch (item.action) {
            case 'update':
              await api.put(`/api/documents/${item.documentId}`, {
                title: item.title,
                content: item.content,
              });
              break;

            case 'create':
              await api.post('/api/documents', {
                content: item.content,
              });
              break;

            case 'delete':
              await api.delete(`/api/documents/${item.documentId}`);
              break;
          }

          // Mark as synced
          if (item.id) {
            await syncQueueDB.markAsSynced(item.id);
          }
        } catch (error) {
          // Silently fail - retry in next sync cycle
        }
      }

    } catch (error) {
      // Silently fail - will retry on next sync
    } finally {
      this.syncing = false;
    }
  }

  async queueChange(
    documentId: string,
    content: string,
    action: 'create' | 'update' | 'delete' = 'update',
    title?: string
  ): Promise<void> {
    try {
      // Save to IndexedDB
      const doc = await documentDB.get(documentId);
      if (doc) {
        await documentDB.save({
          ...doc,
          content,
          synced: navigator.onLine,
          lastSynced: Date.now(),
        });
      }

      // Add to sync queue
      await syncQueueDB.add({
        documentId,
        title,
        content,
        action,
        timestamp: Date.now(),
        synced: false,
      });

      // Try to sync immediately if online
      // Disabled - using manual save instead
      // if (navigator.onLine) {
      //   await this.syncUnsyncedChanges();
      // }
    } catch (error) {
      // Silently fail - changes will be queued on next attempt
    }
  }

  async cacheDocument(id: string, title: string, content: string): Promise<void> {
    try {
      await documentDB.save({
        id,
        title,
        content,
        synced: navigator.onLine,
        lastSynced: Date.now(),
      });
    } catch (error) {
      // Silently fail - caching is not critical
      // IndexedDB errors are usually due to schema issues that resolve on next version
    }
  }

  async getOfflineDocument(id: string) {
    try {
      return await documentDB.get(id);
    } catch (error) {
      console.error('[Get Offline Document Error]:', error);
      return null;
    }
  }

  async clearCache(): Promise<void> {
    try {
      await documentDB.clear();
      await syncQueueDB.clear();
    } catch (error) {
      console.error('[Clear Cache Error]:', error);
    }
  }

  getPendingSyncCount = async (): Promise<number> => {
    try {
      const items = await syncQueueDB.getUnsyncedItems();
      return items?.length || 0;
    } catch (error) {
      return 0;
    }
  };

  isSyncing(): boolean {
    return this.syncing;
  }
}

export const syncService = new SyncService();
