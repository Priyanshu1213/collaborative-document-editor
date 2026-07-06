import api from './api';

export interface Document {
  id: string;
  title: string;
  content: string;
  ownerId: string;
  collaborators: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  content: string;
  createdAt: string;
  createdBy: string;
}

export const documentService = {
  // Get all documents
  getDocuments: async () => {
    const response = await api.get('/api/documents');
    return response.data;
  },

  // Get single document
  getDocument: async (id: string): Promise<Document> => {
    const response = await api.get(`/api/documents/${id}`);
    return response.data;
  },

  // Create document
  createDocument: async (title: string): Promise<Document> => {
    const response = await api.post('/api/documents', { title });
    return response.data;
  },

  // Update document
  updateDocument: async (id: string, data: Partial<Document>): Promise<Document> => {
    const response = await api.put(`/api/documents/${id}`, data);
    return response.data;
  },

  // Delete document
  deleteDocument: async (id: string): Promise<void> => {
    await api.delete(`/api/documents/${id}`);
  },

  // Share document
  shareDocument: async (id: string, email: string, permission: 'view' | 'edit'): Promise<void> => {
    await api.post(`/api/documents/${id}/share`, { email, permission });
  },

  // Update collaborator permission
  updateCollaboratorPermission: async (
    id: string,
    email: string,
    permission: 'view' | 'edit',
  ): Promise<void> => {
    await api.put(`/api/documents/${id}/permissions`, { email, permission });
  },

  // Remove collaborator
  removeCollaborator: async (id: string, collaboratorId: string): Promise<void> => {
    await api.delete(`/api/documents/${id}/collaborators/${collaboratorId}`);
  },

  // Get document versions
  getVersions: async (id: string): Promise<DocumentVersion[]> => {
    const response = await api.get(`/api/documents/${id}/versions`);
    return response.data;
  },

  // Restore version
  restoreVersion: async (documentId: string, versionId: string): Promise<void> => {
    await api.post(`/api/documents/${documentId}/versions/${versionId}/restore`);
  },
};
