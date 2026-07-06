import Dexie, { Table } from 'dexie';

export interface CachedDocument {
  id: string;
  title: string;
  content: string;
  synced: boolean;
  lastSynced?: number;
}

export interface SyncQueueItem {
  id?: number;
  documentId: string;
  title?: string;
  content: string;
  action: 'create' | 'update' | 'delete';
  timestamp: number;
  synced: boolean;
}

class EdTechDB extends Dexie {
  documents!: Table<CachedDocument>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super('EdTechDB');
    this.version(2).stores({
      documents: 'id',
      syncQueue: '++id, documentId, synced, timestamp',
    });
  }
}

export const db = new EdTechDB();

// Document operations
export const documentDB = {
  save: async (doc: CachedDocument) => {
    return db.documents.put(doc);
  },

  get: async (id: string) => {
    return db.documents.get(id);
  },

  getAll: async () => {
    return db.documents.toArray();
  },

  delete: async (id: string) => {
    return db.documents.delete(id);
  },

  clear: async () => {
    return db.documents.clear();
  },
};

// Sync queue operations
export const syncQueueDB = {
  add: async (item: Omit<SyncQueueItem, 'id'>) => {
    return db.syncQueue.add(item);
  },

  getUnsyncedItems: async () => {
    try {
      return await db.syncQueue.filter(item => !item.synced).toArray();
    } catch (error) {
      console.error('[IndexedDB Error]:', error);
      return [];
    }
  },

  markAsSynced: async (id: number) => {
    return db.syncQueue.update(id, { synced: true });
  },

  remove: async (id: number) => {
    return db.syncQueue.delete(id);
  },

  clear: async () => {
    return db.syncQueue.clear();
  },
};
