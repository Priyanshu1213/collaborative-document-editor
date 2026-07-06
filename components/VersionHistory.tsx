'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, ChevronDown, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

interface Version {
  _id: string;
  documentId: string;
  content: string;
  updatedContent?: string;
  title: string;
  createdBy: { name: string; email: string };
  changeDescription: string;
  versionNumber: number;
  createdAt: string;
}

interface VersionHistoryProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
  onRestore: (versionId: string) => void;
}

export default function VersionHistory({
  documentId,
  isOpen,
  onClose,
  onRestore,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchVersions();
    }
  }, [isOpen, documentId]);

  const fetchVersions = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/documents/${documentId}/versions`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch versions');

      const data = await response.json();
      setVersions(data);
    } catch (error) {
      toast.error('Failed to load version history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (versionId: string) => {
    if (!confirm('Are you sure you want to restore this version?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/documents/${documentId}/versions/${versionId}/restore`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Failed to restore version');

      toast.success('Version restored successfully');
      onRestore(versionId);
      onClose();
    } catch (error) {
      toast.error('Failed to restore version');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl max-h-96 rounded-lg bg-background p-6 shadow-lg overflow-y-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Version History</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Versions List */}
        {isLoading ? (
          <div className="text-center text-muted-foreground">Loading versions...</div>
        ) : versions.length === 0 ? (
          <div className="text-center text-muted-foreground">No versions available</div>
        ) : (
          <div className="space-y-2">
            {versions.map((version) => (
              <div
                key={version._id}
                className="rounded-lg border border-border p-3 hover:bg-muted transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">
                        Version {version.versionNumber}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(version.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {version.changeDescription || "Document updated"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      by {version.createdBy?.name || "Unknown user"}
                    </p>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setExpandedVersion(
                          expandedVersion === version._id ? null : version._id
                        );
                      }}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(version._id)}
                      className="gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Restore
                    </Button>
                  </div>
                </div>

                {/* Expanded Preview */}
                {expandedVersion === version._id && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="space-y-2 text-sm text-foreground">
                    <div>
                        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Updated content
                        </div>
                        <div className="max-h-24 overflow-y-auto rounded bg-muted p-2 line-clamp-6">
                          {(version.updatedContent || version.content)?.replace(/<[^>]*>/g, '') || '(Empty)'}
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Previous content
                        </div>
                        <div className="max-h-24 overflow-y-auto rounded bg-muted p-2 line-clamp-6">
                          {version.content?.replace(/<[^>]*>/g, '') || '(Empty)'}
                        </div>
                      </div>
                      
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
