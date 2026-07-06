'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Copy, Check, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Collaborator {
  userId: {
    _id: string;
    name: string;
    email?: string;
  };
  permission: 'view' | 'edit';
}

interface ShareModalProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
  onShare: (email: string, permission: 'view' | 'edit') => void;
  onUpdatePermission?: (email: string, permission: 'view' | 'edit') => void;
  onRemoveCollaborator?: (collaboratorId: string) => void;
  collaborators?: Collaborator[];
  ownerId?: string;
  currentUserId?: string;
}

export default function ShareModal({
  documentId,
  isOpen,
  onClose,
  onShare,
  onUpdatePermission,
  onRemoveCollaborator,
  collaborators,
  ownerId,
  currentUserId,
}: ShareModalProps) {
      const collaboratorList = useMemo(() => collaborators ? Array.from(collaborators) : [], [collaborators]);
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'view' | 'edit'>('edit');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [collaboratorPermissions, setCollaboratorPermissions] = useState<Record<string, 'view' | 'edit'>>({});

  useEffect(() => {
    const initialPermissions: Record<string, 'view' | 'edit'> = {};
    collaboratorList.forEach((collaborator) => {
      initialPermissions[collaborator.userId._id] = collaborator.permission;
    });
    setCollaboratorPermissions(initialPermissions);
  }, [collaboratorList]);

  const isOwnerUser = currentUserId && ownerId === currentUserId;

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter an email');
      return;
    }

    setIsLoading(true);
    try {
      await onShare(email, permission);
      setEmail('');
      setPermission('edit');
      toast.success('Document shared successfully');
    } catch (error) {
      toast.error('Failed to share document');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionUpdate = async (collaborator: Collaborator, nextPermission: 'view' | 'edit') => {
    if (!onUpdatePermission || !isOwnerUser || !collaborator.userId.email) return;

    try {
      setIsLoading(true);
      await onUpdatePermission(collaborator.userId.email, nextPermission);
      setCollaboratorPermissions((prev) => ({
        ...prev,
        [collaborator.userId._id]: nextPermission,
      }));
      toast.success('Permission updated');
    } catch (error) {
      toast.error('Failed to update permission');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (collaboratorId: string) => {
    if (!onRemoveCollaborator || !isOwnerUser) return;

    setIsLoading(true);
    try {
      await onRemoveCollaborator(collaboratorId);
      toast.success('Collaborator removed');
    } catch (error) {
      toast.error('Failed to remove collaborator');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/documents/${documentId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex w-full max-w-md flex-col rounded-lg bg-background shadow-lg max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 pt-6 pb-4 flex-shrink-0">
          <h2 className="text-xl font-bold text-foreground">Share Document</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Share Link */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-foreground">
              Share Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/documents/${documentId}`}
                className="flex-1 rounded-lg border border-border bg-muted px-4 py-2 text-foreground"
              />
              <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-2">
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Share via Email */}
          <form onSubmit={handleShare} className="space-y-4 mb-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Share with Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isLoading || !isOwnerUser}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Permission
              </label>
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value as 'view' | 'edit')}
                className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isLoading || !isOwnerUser}
              >
                <option value="view">Viewer - Can view only</option>
                <option value="edit">Editor - Can edit</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading || !isOwnerUser} className="flex-1">
                {isLoading ? 'Sharing...' : 'Share'}
              </Button>
              <Button variant="outline" onClick={onClose} disabled={isLoading} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>

          {collaboratorList && collaboratorList.length > 0 && (
            <div>
              <h3 className="mb-3 text-lg font-semibold text-foreground">Collaborators</h3>
              <div className="space-y-3">
                {collaboratorList.map((collaborator) => {
                  const isOwnerCollaborator = collaborator.userId._id === ownerId;
                  const canManage = isOwnerUser && !isOwnerCollaborator;
                  return (
                    <div
                      key={collaborator.userId._id}
                      className="flex items-center justify-between rounded-lg border border-border bg-muted px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-foreground">{collaborator.userId.name}</p>
                        <p className="text-sm text-muted-foreground">{collaborator.userId.email || 'No email available'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={collaboratorPermissions[collaborator.userId._id] || collaborator.permission}
                          onChange={(e) => handlePermissionUpdate(collaborator, e.target.value as 'view' | 'edit')}
                          disabled={!canManage || isLoading}
                          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                        >
                          <option value="view">Viewer</option>
                          <option value="edit">Editor</option>
                        </select>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleRemove(collaborator.userId._id)}
                          disabled={!canManage || isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}