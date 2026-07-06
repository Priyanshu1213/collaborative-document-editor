# Offline Support & Sync

## Overview

House of EdTech provides complete offline-first functionality. Users can edit documents without an internet connection, and all changes are automatically synced when they come back online.

## How It Works

### 1. Offline Editing
- When a user goes offline, all document edits are saved to **IndexedDB** (local browser storage)
- Changes are queued in a sync queue with timestamps
- The UI shows "Offline" status with a badge
- Full editor functionality remains available (no read-only mode)

### 2. Automatic Syncing
- The sync service runs in the background every 5 seconds
- When the browser detects the network is online, it automatically syncs pending changes
- The UI displays sync status: "X changes pending" → "Syncing..." → "All synced"
- Sync happens silently - users see notifications only if there are issues

### 3. Conflict Resolution
- Changes are synced in order of timestamp (first edit wins)
- Server-side validation ensures data integrity
- If sync fails, the change remains in the queue and retries automatically

## Components

### IndexedDB Storage (`utils/indexedDB.ts`)
Stores:
- **documents**: Cached document copies with content and metadata
- **syncQueue**: Pending changes waiting to be synced

### Sync Service (`services/syncService.ts`)
Manages:
- Queuing changes while offline
- Automatic syncing when online
- Cache management
- Retry logic for failed syncs

### useOffline Hook (`hooks/useOffline.ts`)
Detects:
- Network status changes
- Online/offline transitions
- Used to show appropriate UI states

## Usage in Editor

### Offline Save
When offline, changes auto-save to IndexedDB every 2 seconds:
```typescript
// User edits document
handleContentChange(newContent);

// Auto-save triggers (offline mode)
await syncService.queueChange(documentId, content, 'update');
await syncService.cacheDocument(documentId, title, content);
```

### Online Sync
When online, changes auto-sync to the server:
```typescript
// sync service runs every 5 seconds
const unsyncedItems = await syncQueueDB.getUnsyncedItems();
// Each item is sent to server
// Once confirmed, marked as synced
```

## Features

### Real-time Status Indicators
- 📱 **Offline Mode**: Shows when user has no internet
- ☁️ **X changes pending**: Shows unsynced changes count
- ✅ **All synced**: Shows when everything is up to date
- 🌐 **Active users**: Shows collaborative editing status

### Pending Sync Display
The editor header shows:
- Offline badge when disconnected
- Pending sync count while syncing
- Green checkmark when synced
- Network status icon (WiFi/WiFiOff)

### Manual Save
Users can click "Save" to immediately sync if online, or queue changes if offline.

## Data Safety

### What Happens to Offline Changes
1. User edits offline → Changes saved to IndexedDB
2. User comes online → Changes automatically synced to server
3. If sync fails → Changes stay in IndexedDB, retry continues
4. Browser refresh → Changes loaded from IndexedDB, sync continues

### What Happens on Server
1. Each change is timestamped
2. Changes are processed in order
3. Version history tracks all changes
4. Collaborative users are notified via WebSocket

## Version History with Offline

Version history works with offline changes:
- Offline edits create versions in the sync queue
- When synced, versions are created on the server
- Users can view and restore from any version

## Limitations

- IndexedDB has a size limit (~50MB on most browsers)
- Syncing very large documents may take longer
- If user clears browser data, offline changes are lost

## Future Enhancements

- Service Workers for background sync
- Conflict resolution UI for concurrent edits
- Differential sync (send only deltas, not full content)
- Custom sync intervals per document
