'use client';

import Link from 'next/link';
import { FileText, Share2, MoreVertical, Trash2, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';

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
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-elevated">
      {/* Gradient accent strip */}
      <div className="absolute inset-x-0 top-0 h-1 bg-brand-gradient opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <Link href={`/editor/${id}`} className="block cursor-pointer p-5">
        {/* Header with icon and menu */}
        <div className="mb-4 flex items-start justify-between">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/15 transition-colors group-hover:bg-primary/15">
            <FileText className="h-5 w-5" />
          </span>

          <div className="relative" ref={menuRef}>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.preventDefault();
                setShowMenu(!showMenu);
              }}
              className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100"
              aria-expanded={showMenu}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="animate-float-up absolute right-0 top-9 z-10 w-44 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-elevated">
                {isOwner && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      onShare(id);
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
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
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="mb-1 line-clamp-2 text-balance font-semibold text-foreground transition-colors group-hover:text-primary">
          {title || 'Untitled Document'}
        </h3>
        <p className="mb-4 truncate text-xs text-muted-foreground">by {owner}</p>

        {/* Metadata */}
        <div className="flex items-center justify-between border-t border-border/70 pt-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {formatDate(updatedAt)}
          </span>
          {collaborators && collaborators.length > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {collaborators.length}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
