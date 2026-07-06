// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  TIMEOUT: 30000,
};

// Socket.io Configuration
export const SOCKET_CONFIG = {
  URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000',
  AUTO_CONNECT: true,
  RECONNECTION: true,
  RECONNECTION_DELAY: 1000,
  RECONNECTION_DELAY_MAX: 5000,
  RECONNECTION_ATTEMPTS: 5,
};

// Editor Configuration
export const EDITOR_CONFIG = {
  AUTO_SAVE_INTERVAL: 2000, // 2 seconds
  SYNC_INTERVAL: 5000, // 5 seconds
  DEBOUNCE_DELAY: 1000, // 1 second
};

// Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  RECENT_DOCUMENTS: 'recent_documents',
  PREFERENCES: 'preferences',
};

// Editor Events
export const EDITOR_EVENTS = {
  CONTENT_CHANGE: 'content:change',
  CURSOR_MOVE: 'cursor:move',
  USER_TYPING: 'user:typing',
  USER_JOIN: 'user:join',
  USER_LEAVE: 'user:leave',
  DOCUMENT_UPDATE: 'document:update',
  SYNC_START: 'sync:start',
  SYNC_END: 'sync:end',
};

// AI Features
export const AI_FEATURES = {
  SUMMARIZE: 'summarize',
  REWRITE: 'rewrite',
  GRAMMAR_FIX: 'grammar_fix',
  EXPLAIN: 'explain',
};

// Document Permissions
export const PERMISSIONS = {
  VIEW: 'view',
  EDIT: 'edit',
  ADMIN: 'admin',
} as const;
