# DocVerse - Backend

A Node.js + Express.js backend for the DocVerse collaborative document editor with MongoDB database.

## Features

- 🔐 **JWT Authentication** - Secure token-based authentication
- 📚 **Document Management** - Full CRUD operations with permissions
- 👥 **Collaboration** - Real-time document sharing and permissions
- 📝 **Version History** - Track and restore document versions
- 🔌 **Socket.io** - Real-time updates and collaboration
- 🛡️ **Error Handling** - Comprehensive error handling
- 🗂️ **MongoDB** - Flexible document storage with Mongoose

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.io
- **Auth**: JWT (JSON Web Tokens)
- **Security**: bcryptjs for password hashing

## Project Structure

```
backend/
├── config/              # Configuration files
│   └── db.js           # MongoDB connection
├── controllers/        # Request handlers
│   ├── authController.js
│   └── documentController.js
├── middleware/        # Express middleware
│   └── auth.js       # JWT authentication
├── models/            # MongoDB schemas
│   ├── User.js
│   ├── Document.js
│   └── Version.js
├── routes/            # API routes
│   ├── authRoutes.js
│   └── documentRoutes.js
├── utils/             # Utility functions (expand as needed)
├── app.js            # Express app setup
├── server.js         # Server entry point with Socket.io
├── package.json
└── .env.example
```

## Getting Started

### Prerequisites

- Node.js 18+ with pnpm
- MongoDB (local or Atlas)
- Git

### Installation

1. **Install dependencies**:
```bash
pnpm install
```

2. **Setup environment variables**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start development server**:
```bash
pnpm dev
```

The server will start on http://localhost:5000

### MongoDB Setup

#### Local MongoDB
```bash
# macOS with Homebrew
brew services start mongodb-community

# Windows
# Start MongoDB from Services or run mongod.exe

# Linux
sudo systemctl start mongod
```

#### MongoDB Atlas (Cloud)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Add to `.env`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/edtech?retryWrites=true&w=majority
```

## Available Scripts

- `pnpm dev` - Start development server with auto-reload
- `pnpm start` - Start production server

## API Endpoints

### Authentication

```
POST   /api/auth/register      - Register new user
POST   /api/auth/login         - Login user
GET    /api/auth/me            - Get current user (protected)
PUT    /api/auth/profile       - Update user profile (protected)
```

### Documents

```
GET    /api/documents          - Get all user documents (protected)
POST   /api/documents          - Create document (protected)
GET    /api/documents/:id      - Get single document (protected)
PUT    /api/documents/:id      - Update document (protected)
DELETE /api/documents/:id      - Delete/archive document (protected)
POST   /api/documents/:id/share - Share document (protected)
DELETE /api/documents/:id/collaborators/:id - Remove collaborator (protected)
```

## Authentication Flow

1. User sends email and password to `/api/auth/register` or `/api/auth/login`
2. Server validates credentials and hashes password (register) or compares with hash (login)
3. Server generates JWT token with user ID
4. Token sent to client
5. Client includes token in `Authorization: Bearer <token>` header for protected routes
6. Server verifies token and allows access

## Database Schema

### User
- `name` (String, required)
- `email` (String, required, unique)
- `password` (String, required, hashed)
- `avatar` (String, optional)
- `bio` (String, optional)
- `isActive` (Boolean, default: true)
- `timestamps` (createdAt, updatedAt)

### Document
- `title` (String, default: "Untitled Document")
- `content` (String)
- `ownerId` (ObjectId, ref: User)
- `collaborators` (Array of {userId, permission})
- `tags` (Array of Strings)
- `isPublic` (Boolean)
- `isArchived` (Boolean)
- `timestamps` (createdAt, updatedAt)

### Version
- `documentId` (ObjectId, ref: Document)
- `content` (String)
- `title` (String)
- `createdBy` (ObjectId, ref: User)
- `changeDescription` (String)
- `versionNumber` (Number)
- `timestamps` (createdAt, updatedAt)

## Socket.io Events

**Client → Server:**
- `join_document` - Join a document room
- `leave_document` - Leave a document room
- `content_change` - Document content updated
- `cursor_move` - Cursor position changed
- `user_typing` - User is typing

**Server → Client:**
- `active_users` - List of active users in room
- `remote_content_change` - Another user changed content
- `remote_cursor_move` - Another user moved cursor
- `user_typing` - Another user is typing

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment mode | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/edtech |
| `JWT_SECRET` | JWT signing secret | your-secret-key |
| `JWT_EXPIRE` | JWT token expiration | 7d |
| `CLIENT_URL` | Frontend URL for CORS | http://localhost:3000 |

## Error Handling

All errors return JSON response with status code and error message:

```json
{
  "error": "Error message here"
}
```

Common status codes:
- `200` - Success
- `201` - Created
- `400` - Bad request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not found
- `500` - Server error

## Security Considerations

- Passwords are hashed with bcryptjs before storage
- JWT tokens used for stateless authentication
- CORS configured to allow only frontend origin
- Environment variables for sensitive data
- Password field excluded from default queries

## Frontend Build Hosting

To deploy the frontend from this backend:

1. Build the frontend app.
2. Copy the generated files into the backend/public directory.
3. Start the backend with `pnpm start`.

When backend/public/index.html exists, the backend will serve it for the root route.

## Next Steps

- [ ] Add version history endpoints
- [ ] Implement AI integration
- [ ] Add real-time sync queue
- [ ] Setup email notifications
- [ ] Add rate limiting
- [ ] Implement refresh tokens
- [ ] Add API documentation (Swagger)
- [ ] Setup unit tests
- [ ] Add logging system

## Troubleshooting

### MongoDB connection fails
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify network access (for Atlas)

### JWT errors
- Verify JWT_SECRET is set
- Check token format in Authorization header
- Ensure token hasn't expired

### CORS errors
- Check CLIENT_URL in `.env`
- Verify frontend making requests from correct origin

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

MIT
