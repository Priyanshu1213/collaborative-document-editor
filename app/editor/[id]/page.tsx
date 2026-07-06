'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { documentService } from '@/services/documentService';
import { syncService } from '@/services/syncService';
import { useSocket } from '@/hooks/useSocket';
import { useOffline } from '@/hooks/useOffline';
import { Save, Share2, MoreVertical, Users, ChevronLeft, Cloud, CloudOff, Wifi, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';
import RichTextEditor from '@/components/RichTextEditor';
import ShareModal from '@/components/ShareModal';
import VersionHistory from '@/components/VersionHistory';
import { EDITOR_CONFIG } from '@/utils/constants';

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;
  
  const [document, setDocument] = useState<any>(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isEditable, setIsEditable] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const currentUserId =
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('user') || '{}')?.id
      : undefined;
  const { isConnected, activeUsers, on, off, emit } = useSocket(documentId);
  const { isOnline, isOffline } = useOffline();
  
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const syncCheckTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchDocument = useCallback(async () => {
    try {
      const doc = await documentService.getDocument(documentId);
      setDocument(doc);
      setContent(doc.content || '');
      setTitle(doc.title);

      const ownerId =
        typeof doc.ownerId === 'object' && doc.ownerId !== null
          ? (doc.ownerId as { _id?: string })._id
          : (doc.ownerId as string | undefined);
      const collaborator = (doc.collaborators || []).find((c: any) => {
        const collaboratorUserId =
          typeof c.userId === 'object' && c.userId !== null ? c.userId._id : c.userId;
        return collaboratorUserId === currentUserId;
      }) as { permission?: 'view' | 'edit' } | undefined;
      const editable = ownerId === currentUserId || collaborator?.permission === 'edit';
      setIsOwner(ownerId === currentUserId);
      setIsEditable(editable);
      
      // Cache document for offline access
      await syncService.cacheDocument(
        doc.id || documentId,
        doc.title,
        doc.content || ''
      );
      
      setIsLoading(false);
    } catch (error) {
      const cachedDoc = await syncService.getOfflineDocument(documentId);
      if (cachedDoc) {
        setDocument(cachedDoc);
        setContent(cachedDoc.content || '');
        setTitle(cachedDoc.title || '');
        setUnsavedChanges(false);
        toast.success('Loaded latest local copy');
      } else {
        toast.error('Failed to load document');
      }
      setIsLoading(false);
    }
  }, [documentId, currentUserId]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchDocument();
    
    // Start sync service
    syncService.startAutoSync(5000);
    
    return () => {
      syncService.stopAutoSync();
    };
  }, [documentId, router, fetchDocument]);

  useEffect(() => {
    const handleRemoteContentChange = (data: { documentId: string; content: string; userId?: string }) => {
      if (data.documentId !== documentId) return;
      setContent(data.content);
      setUnsavedChanges(false);
    };

    const handleCollaboratorUpdate = (data: { documentId: string }) => {
      if (data.documentId !== documentId) return;
      // Refetch document to get updated collaborators list
      fetchDocument();
    };

    on('remote_content_change', handleRemoteContentChange);
    on('collaborator_added', handleCollaboratorUpdate);
    on('permission_updated', handleCollaboratorUpdate);
    on('collaborator_removed', handleCollaboratorUpdate);

    return () => {
      off('remote_content_change');
      off('collaborator_added');
      off('permission_updated');
      off('collaborator_removed');
    };
  }, [documentId, on, off, fetchDocument]);

  const handleOfflineSave = useCallback(async () => {
    if (!unsavedChanges) return;

    try {
      // Cache document locally for offline access
      await syncService.cacheDocument(documentId, title, content);
      await syncService.queueChange(documentId, content, 'update', title);
      
      setUnsavedChanges(false);
      toast.success('Saved offline', { 
        duration: 2000,
      });
    } catch (error) {
      // Silently fail - offline save is best-effort
    }
  }, [documentId, title, content, unsavedChanges]);

  const handleAutoSave = useCallback(async () => {
    if (!unsavedChanges || isOffline) return;

    setIsSaving(true);
    try {
      await documentService.updateDocument(documentId, {
        title,
        content,
      });
      await syncService.cacheDocument(documentId, title, content);
      void syncService.syncUnsyncedChanges();
      
      setUnsavedChanges(false);
      toast.success('Document saved', { duration: 2000 });
    } catch (error) {
      if (!isOffline) {
        toast.error('Failed to save document');
      }
    } finally {
      setIsSaving(false);
    }
  }, [documentId, title, content, unsavedChanges, isOffline]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (isOffline) {
        // Save offline
        await handleOfflineSave();
      } else {
        // Save online
        await documentService.updateDocument(documentId, {
          title,
          content,
        });
        
        setUnsavedChanges(false);
        toast.success('Document saved');
      }
    } catch (error) {
      toast.error('Failed to save document');
    } finally {
      setIsSaving(false);
    }
  };

  const handleContentChange = (newContent: string) => {
    if (!isEditable) return;
    setContent(newContent);
    setUnsavedChanges(true);
    if (isConnected && !isOffline) {
      emit('content:change', {
        documentId,
        content: newContent,
        userId: currentUserId,
      });
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setUnsavedChanges(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-aurora">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <span className="h-9 w-9 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="text-sm">Loading document…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => router.push('/dashboard')}
              aria-label="Back to dashboard"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              disabled={!isEditable}
              className="min-w-0 flex-1 rounded-lg bg-transparent px-2 py-1 text-lg font-semibold text-foreground outline-none transition-colors hover:bg-muted/50 focus:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-70 sm:text-xl"
              placeholder="Untitled document"
            />
            <div className="flex shrink-0 items-center gap-2">
              {unsavedChanges && (
                <span className="hidden text-xs font-medium text-amber-600 dark:text-amber-400 sm:inline">
                  Unsaved
                </span>
              )}
              {isOffline ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                  <WifiOff className="h-3 w-3" />
                  <span className="hidden sm:inline">Offline</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <Wifi className="h-3 w-3" />
                  <span className="hidden sm:inline">Connected</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {isConnected && activeUsers.length > 0 && (
              <div className="hidden items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground sm:flex">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                {activeUsers.length} online
              </div>
            )}

            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setShareModalOpen(true)}
                disabled={isOffline}
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setHistoryModalOpen(true)}
            >
              History
            </Button>

            <Button
              size="sm"
              className="gap-2 shadow-glow"
              onClick={handleSave}
              disabled={isSaving || !unsavedChanges || !isEditable}
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </header>

      {/* Editor */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          {!isEditable && (
            <div className="mb-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
              You have view-only access. Only document owners and editors can make changes.
            </div>
          )}

          <RichTextEditor
            content={content}
            onChange={handleContentChange}
            readOnly={!isEditable}
          />
        </div>
      </main>

      <VersionHistory
        documentId={documentId}
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        onRestore={async () => {
          await fetchDocument();
          setUnsavedChanges(false);
        }}
      />

      {/* Share Modal */}
      <ShareModal
        documentId={documentId}
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        collaborators={document?.collaborators}
        ownerId={document?.ownerId?._id || document?.ownerId}
        currentUserId={currentUserId}
        onShare={async (email, permission) => {
          await documentService.shareDocument(documentId, email, permission);
          await fetchDocument();
        }}
        onUpdatePermission={async (email, permission) => {
          await documentService.updateCollaboratorPermission(documentId, email, permission);
          await fetchDocument();
        }}
        onRemoveCollaborator={async (collaboratorId) => {
          await documentService.removeCollaborator(documentId, collaboratorId);
          await fetchDocument();
        }}
      />
    </div>
  );
}
