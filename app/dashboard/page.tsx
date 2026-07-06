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
      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Filter Tabs */}
        <div className="mb-8 flex gap-2 border-b border-border">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 font-medium transition-colors ${
              filterType === 'all'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Documents
          </button>
          <button
            onClick={() => setFilterType('owned')}
            className={`px-4 py-2 font-medium transition-colors ${
              filterType === 'owned'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            My Documents
          </button>
          <button
            onClick={() => setFilterType('shared')}
            className={`px-4 py-2 font-medium transition-colors ${
              filterType === 'shared'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Shared with Me
          </button>
        </div>

        {/* Create Document Section */}
        <div className="mb-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">
              {filterType === 'all'
                ? 'All Documents'
                : filterType === 'owned'
                  ? 'My Documents'
                  : 'Shared with Me'}
            </h2>
            <Button onClick={handleCreateDocument} className="gap-2">
              <Plus className="h-4 w-4" /> New Document
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center text-muted-foreground">Loading documents...</div>
          ) : filteredDocuments.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-border p-12 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold text-foreground">No documents found</h3>
              <p className="mb-6 text-muted-foreground">
                {searchQuery ? 'Try adjusting your search query' : 'Create your first document to get started'}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreateDocument}>Create Document</Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
