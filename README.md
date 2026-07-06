# House of EdTech - Frontend

A collaborative document editor built with **Next.js 16**, **React 19**, and **TailwindCSS**.

## Features

- 📝 **Rich Text Editing** - Full-featured editor with markdown support
- 👥 **Real-time Collaboration** - Live cursors, typing indicators, and instant sync via Socket.io
- 📱 **Offline Support** - IndexedDB caching and automatic sync when back online
- 🔐 **Authentication** - JWT-based authentication with secure token management
- 📚 **Version History** - Track document changes and restore previous versions
- 🤖 **AI Features** - Summarize, rewrite, grammar check, and content suggestions
- 🔗 **Document Sharing** - Share documents with granular permissions
- 🎨 **Modern UI** - Built with shadcn/ui components and TailwindCSS

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **UI**: React 19.2, shadcn/ui, TailwindCSS v4
- **State Management**: Zustand, React Query (SWR)
- **Real-time**: Socket.io Client
- **Storage**: IndexedDB (Dexie), localStorage
- **Editor**: TipTap (coming in next phase)
- **HTTP**: Axios
- **Notifications**: React Hot Toast

## Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Landing page
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── dashboard/         # Dashboard
│   ├── editor/[id]/       # Document editor
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # Reusable React components
│   └── ui/               # shadcn/ui components
├── hooks/                # Custom React hooks
│   ├── useAuth.ts        # Authentication hook
│   ├── useSocket.ts      # Socket.io connection
│   └── useOffline.ts     # Offline detection
├── services/             # API service layer
│   ├── api.ts            # Axios instance with interceptors
│   ├── authService.ts    # Authentication APIs
│   └── documentService.ts # Document APIs
├── utils/                # Utility functions
│   ├── indexedDB.ts      # IndexedDB operations
│   └── constants.ts      # App constants
└── public/               # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+ (with pnpm)
- Backend API running (see backend README)

### Installation

1. **Install dependencies**:
```bash
pnpm install
```

2. **Setup environment variables**:
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

3. **Start development server**:
```bash
pnpm dev
```

Open http://localhost:3000 in your browser.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | http://localhost:5000 |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.io server URL | http://localhost:5000 |
| `NEXT_PUBLIC_GEMINI_API_KEY` | Google Gemini API key (optional) | - |
| `NEXT_PUBLIC_OPENAI_API_KEY` | OpenAI API key (optional) | - |

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## Authentication Flow

1. User registers/logs in via `/register` or `/login`
2. Backend returns JWT token and user info
3. Token stored in localStorage
4. All API requests include token in Authorization header
5. Token automatically cleared on 401 response

## Real-time Collaboration

- Uses Socket.io for real-time updates
- Automatic connection on document load
- Tracks active users and their cursors
- Broadcasts content changes to all connected clients
- Handles connection drops gracefully

## Offline Support

- IndexedDB stores documents locally
- Sync queue tracks unsaved changes
- Automatic sync when connection restored
- Offline indicator shown in UI
- Works seamlessly without network

## API Integration

The frontend communicates with the backend API at:
```
POST   /api/auth/login
POST   /api/auth/register
GET    /api/documents
POST   /api/documents
GET    /api/documents/:id
PUT    /api/documents/:id
DELETE /api/documents/:id
POST   /api/documents/:id/share
GET    /api/documents/:id/versions
POST   /api/documents/:id/versions/:versionId/restore
```

## Next Steps

- [ ] Implement TipTap rich text editor
- [ ] Build version history UI
- [ ] Integrate AI features
- [ ] Add document sharing modal
- [ ] Implement collaborative cursors
- [ ] Add dark mode support
- [ ] Setup error boundaries
- [ ] Add unit tests

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

MIT
