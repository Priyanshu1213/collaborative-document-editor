'use client';

import Link from 'next/link';
import { FileText, Share2, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface DocumentCardProps {
  id: string;
  title: string;
  updatedAt: string;
  collaborators: string[];
  owner: string;
  isOwner?: boolean;
  onDelete: (id: string) => void;
  onShare: (id: string) => void;
}

export default function DocumentCard({
  id,
  title,
  updatedAt,
  collaborators,
  owner,
  isOwner = false,
  onDelete,
  onShare,
}: DocumentCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="group relative rounded-lg border border-border bg-card/30 p-4 transition-all hover:border-primary hover:shadow-lg">
      <Link href={`/editor/${id}`}>
        <div className="cursor-pointer">
          {/* Header with icon and menu */}
          <div className="mb-4 flex items-start justify-between">
            <FileText className="h-8 w-8 text-primary" />
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  setShowMenu(!showMenu);
                }}
                className="opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 top-8 z-10 w-40 rounded-lg border border-border bg-background shadow-lg">
                  {isOwner && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      onShare(id);
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </button>
                )}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      onDelete(id);
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-muted"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className="mb-3 font-semibold text-foreground line-clamp-2 text-balance">
            {title}
          </h3>

          {/* Metadata */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Last edited {formatDate(updatedAt)}</p>
            {collaborators && collaborators.length > 0 && (
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                <span>{collaborators.length} collaborators</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
