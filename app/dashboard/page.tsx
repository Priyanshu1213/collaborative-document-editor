'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardHeader from '@/components/DashboardHeader';
import DocumentCard from '@/components/DocumentCard';
import ShareModal from '@/components/ShareModal';
import io from 'socket.io-client';

interface Document {
  _id: string;
  id?: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  ownerId: { _id: string; name: string };
  collaborators: Array<{
    userId: { _id: string; name: string; email?: string };
    permission: 'view' | 'edit';
  }>;
}

type FilterType = 'all' | 'owned' | 'shared';

export default function DashboardPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [userName, setUserName] = useState('User');
  const [userEmail, setUserEmail] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  const fetchDocuments = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch documents');

      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/login');
      return;
    }

    const user = localStorage.getItem('user');
    let userData = null;

    if (user) {
      try {
        userData = JSON.parse(user);
      } catch {
        userData = null;
      }
    }

    setUserName(userData?.name || 'User');
    setUserEmail(userData?.email || '');
    setCurrentUserId(userData?.id);
    setMounted(true);
    fetchDocuments();

    // Connect to Socket.io for real-time updates
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      auth: { token },
    });

    // Join dashboard room
    socket.emit('join_dashboard', { userId: userData.id });

    // Listen for document updates
    socket.on('documents:updated', () => {
      fetchDocuments();
    });

    return () => {
      socket.emit('leave_dashboard', { userId: userData.id });
      socket.disconnect();
    };
  }, [router, fetchDocuments]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
    toast.success('Logged out successfully');
  };

  const handleCreateDocument = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: 'Untitled Document' }),
      });

      if (!response.ok) throw new Error('Failed to create document');

      const doc = await response.json();
      router.push(`/editor/${doc._id}`);
    } catch (error) {
      toast.error('Failed to create document');
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/documents/${docId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Failed to delete document');

      setDocuments(documents.filter((doc) => doc._id !== docId));
      toast.success('Document deleted');
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  const handleShareDocument = (docId: string) => {
    setSelectedDocumentId(docId);
    setShareModalOpen(true);
  };

  const handleShareSubmit = async (email: string, permission: 'view' | 'edit') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/documents/${selectedDocumentId}/share`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email, permission }),
        }
      );

      if (!response.ok) throw new Error('Failed to share document');

      await fetchDocuments();
      setShareModalOpen(false);
      toast.success('Document shared successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to share document');
    }
  };



  // Filter and search documents
  const filteredDocuments = useMemo(() => {
    let filtered = documents;

    // Apply filter
    if (filterType === 'owned') {
      filtered = filtered.filter((doc) => doc.ownerId._id);
    } else if (filterType === 'shared') {
      filtered = filtered.filter((doc) => doc.collaborators.length > 0);
    }

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter((doc) =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [documents, filterType, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <DashboardHeader
        userName={userName}
        userEmail={userEmail}
        onLogout={handleLogout}
        onSearch={setSearchQuery}
      />

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Section header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {filterType === 'all'
                ? 'All Documents'
                : filterType === 'owned'
                  ? 'My Documents'
                  : 'Shared with Me'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isLoading
                ? 'Loading your workspace…'
                : `${filteredDocuments.length} document${filteredDocuments.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <Button onClick={handleCreateDocument} size="lg" className="gap-2 shadow-glow">
            <Plus className="h-4 w-4" /> New Document
          </Button>
        </div>

        {/* Filter Tabs — segmented control */}
        <div className="mb-8 inline-flex rounded-xl border border-border bg-muted/50 p-1">
          {([
            ['all', 'All'],
            ['owned', 'My Documents'],
            ['shared', 'Shared'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilterType(value)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
                filterType === value
                  ? 'bg-card text-foreground shadow-soft'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Documents */}
        <div className="mb-12">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-44 animate-pulse rounded-2xl border border-border bg-card/60"
                />
              ))}
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card/40 p-14 text-center">
              <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
                <FileText className="h-7 w-7" />
              </span>
              <h3 className="mb-2 text-lg font-semibold text-foreground">No documents found</h3>
              <p className="mb-6 max-w-sm text-muted-foreground">
                {searchQuery
                  ? 'Try adjusting your search query to find what you are looking for.'
                  : 'Create your first document to get started with House of EdTech.'}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreateDocument} size="lg" className="gap-2 shadow-glow">
                  <Plus className="h-4 w-4" /> Create Document
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDocuments.map((doc) => (
                <DocumentCard
                  key={doc._id}
                  id={doc._id}
                  title={doc.title}
                  updatedAt={doc.updatedAt}
                  collaborators={doc.collaborators.map((c) => c.userId.name)}
                  owner={doc.ownerId.name}
                  isOwner={mounted && doc.ownerId._id === currentUserId}
                  onDelete={handleDeleteDocument}
                  onShare={handleShareDocument}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Share Modal */}
      <ShareModal
        documentId={selectedDocumentId || ''}
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        collaborators={documents.find((doc) => doc._id === selectedDocumentId)?.collaborators}
        ownerId={documents.find((doc) => doc._id === selectedDocumentId)?.ownerId._id}
        currentUserId={currentUserId}
        onShare={handleShareSubmit}
        onUpdatePermission={async (email, permission) => {
          if (!selectedDocumentId) return;
          const token = localStorage.getItem('token');
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/documents/${selectedDocumentId}/permissions`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ email, permission }),
            }
          );
          if (!response.ok) throw new Error('Failed to update permission');
          await fetchDocuments();
        }}
        onRemoveCollaborator={async (collaboratorId) => {
          if (!selectedDocumentId) return;
          const token = localStorage.getItem('token');
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/documents/${selectedDocumentId}/collaborators/${collaboratorId}`,
            {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (!response.ok) throw new Error('Failed to remove collaborator');
          await fetchDocuments();
        }}
      />
    </div>
  );
}
