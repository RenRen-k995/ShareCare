# ShareCare

ShareCare is a community platform where users can share items, knowledge, or emotional support with each other.

## Features

### Authentication

- **Register, Login, Logout**: JWT-based authentication system
- **User Profiles**: Name, avatar, rating, bio
- **Profile Management**: Update profile information

### Post System

- **Create Posts**: Title, description, category (items/knowledge/emotional support), image/file upload
- **Edit & Delete**: Users can manage their own posts
- **Post Status**: Available, pending, donated, closed
- **Feed View**: Browse all posts with pagination
- **Filter by Category**: Filter posts by category type
- **Search**: Keyword search across posts
- **Reactions**: Like/heart posts

### Comments & Reactions

- **Public Comments**: Comment under posts to ask questions
- **Reactions**: React with like/heart emojis
- **Admin Moderation**: Admins can delete abusive comments

### Report System

- **Report Posts**: Users can report posts with reasons (spam, inappropriate, scam, harassment)
- **Admin Dashboard**:
  - View all reports
  - Hide or delete reported posts
  - Block abusive users
  - Review and resolve reports

### Real-time Chat (Socket.IO)

**Main Client-Server Feature**

**Chat Features:**

- ✅ 1-to-1 messaging between item owner and recipient
- ✅ Real-time messaging with Socket.IO
- ✅ **Offline delivery**: Messages stored when recipient offline, delivered on reconnect
- ✅ File sending: Images, PDFs, documents
- ✅ Chat search functionality
- ✅ Read receipts (double check marks)
- ✅ Message reactions (emoji)
- ✅ Typing indicators
- ✅ Room-based conversations (userA_userB)

**Frontend Chat UI:**

- ✅ **ChatList**: Conversations list with last message and unread count
- ✅ **ChatWindow**: Infinite scroll, typing indicator, read receipts, file previews
- ✅ **MessageInput**: Text input, file upload, emoji picker, optimistic UI

### Security

- ✅ Only room participants can access chat/history
- ✅ Rate limiting on message sending
- ✅ File type validation (images, PDF, DOC only, max 10MB)
- ✅ Content sanitization
- ✅ JWT authentication on all protected routes

### Admin Panel

- ✅ View all posts
- ✅ View/resolve reports
- ✅ Block/unblock users
- ✅ Delete or hide posts
- ✅ **Statistics Dashboard**:
  - Most shared categories
  - Number of successful donations
  - Active users (last 30 days)
  - Posts by category
  - Recent activity (last 7 days)

## Tech Stack

### Backend

- Node.js + Express.js
- MongoDB + Mongoose ODM
- Socket.IO for real-time communication
- JWT Authentication
- Multer for file uploads
- PatternCraft Architecture (Models, Repositories, Services, Controllers)

### Frontend

- React 18
- Vite
- Socket.IO Client
- TailwindCSS
- shadcn/ui components
- React Router
- Axios

## Project Structure

```
ShareCare/
├── backend/
│   ├── src/
│   │   ├── config/          # Database & Socket.IO configuration
│   │   ├── models/          # Mongoose models (User, Post, Chat, Message, Comment, Report)
│   │   ├── repositories/    # Data access layer
│   │   ├── services/        # Business logic layer
│   │   ├── controllers/     # Request handlers
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Auth, upload, error handling, rate limiting
│   │   └── server.js        # Entry point with Socket.IO
│   ├── uploads/             # Uploaded files
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   │   ├── chat/        # ChatList, ChatWindow, MessageInput
│   │   │   └── ui/          # shadcn/ui components
│   │   ├── pages/           # Page components (Home, Chat, PostDetail, AdminPanel)
│   │   ├── contexts/        # AuthContext, SocketContext
│   │   ├── services/        # API service functions
│   │   ├── lib/             # Utilities
│   │   └── main.jsx         # Entry point
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (v6+)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sharecare
JWT_SECRET=your_jwt_secret_key_here
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

4. Start MongoDB (if running locally):

```bash
mongod
```

5. Start the backend server:

```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env` file:

```env
VITE_API_URL=http://localhost:5000
```

4. Start the frontend development server:

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Demo Scenario

The application fully supports this workflow:

1. **User A** creates a post for an item they want to donate
2. **User B** browses the feed and opens the post
3. **User B** clicks "Contact to Receive" button
4. A real-time chat opens between User A and User B
5. **User B** sends a message while User A is offline
6. System stores the undelivered message
7. **User A** comes online and receives all pending messages automatically
8. They arrange the exchange through chat (with file sharing for proof/photos)
9. **User B** receives the item
10. **User A** marks the post status as "donated"
11. Post status changes and is filtered out from main feed
12. Post remains visible in User A's profile history

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update profile (protected)

### Posts

- `GET /api/posts` - Get all posts (with filters: category, status, search)
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create post (protected)
- `PUT /api/posts/:id` - Update post (protected)
- `DELETE /api/posts/:id` - Delete post (protected)
- `PATCH /api/posts/:id/status` - Update post status (protected)
- `POST /api/posts/:id/reaction` - Toggle reaction (protected)

### Comments

- `GET /api/comments/post/:postId` - Get comments for post
- `POST /api/comments` - Create comment (protected)
- `DELETE /api/comments/:id` - Delete comment (protected/admin)

### Chat

- `POST /api/chat` - Get or create chat (protected)
- `GET /api/chat` - Get user's chats (protected)
- `GET /api/chat/:chatId/messages` - Get chat messages (protected)
- `POST /api/chat/message` - Send message (protected, HTTP fallback)
- `POST /api/chat/upload` - Upload file (protected)

### Reports

- `POST /api/reports` - Create report (protected)
- `GET /api/reports` - Get reports (admin)

### Admin

- `GET /api/admin/statistics` - Get dashboard statistics (admin)
- `GET /api/admin/reports` - Get all reports (admin)
- `PATCH /api/admin/reports/:reportId` - Review report (admin)
- `GET /api/admin/posts` - Get all posts (admin)
- `DELETE /api/admin/posts/:postId` - Delete post (admin)
- `PATCH /api/admin/posts/:postId/hide` - Hide post (admin)
- `GET /api/admin/users` - Get all users (admin)
- `PATCH /api/admin/users/:userId/block` - Block/unblock user (admin)

## Socket.IO Events

### Client → Server

- `chat:join` - Join a chat room
- `message:send` - Send a message
- `message:read` - Mark message as read
- `typing:start` - Start typing indicator
- `typing:stop` - Stop typing indicator
- `message:react` - React to a message
- `chat:search` - Search messages in chat

### Server → Client

- `message:receive` - Receive new message
- `message:sent` - Confirmation message sent
- `message:delivered` - Message delivered to recipient
- `message:read:update` - Message read by recipient
- `message:reaction:update` - Reaction added/removed
- `typing:user` - User typing status
- `chat:updated` - Chat metadata updated
- `user:online` - User came online
- `user:offline` - User went offline

## Architecture

### Backend (PatternCraft Pattern)

```
Request → Route → Controller → Service → Repository → Model → Database
```

- **Models**: Mongoose schemas and data validation
- **Repositories**: Database queries and data access
- **Services**: Business logic and data transformation
- **Controllers**: Request handling and response formatting
- **Routes**: API endpoint definitions
- **Middleware**: Authentication, file upload, error handling, rate limiting

### Real-time Communication

- Socket.IO handles WebSocket connections
- JWT authentication on socket connection
- Room-based messaging (chat rooms)
- Message persistence in MongoDB
- Offline message queuing and delivery

## Security Features

1. **Authentication**: JWT tokens with secure secrets
2. **Authorization**: Route-level and resource-level access control
3. **Rate Limiting**: Prevents spam and abuse
4. **File Validation**: Type and size restrictions
5. **Input Sanitization**: Prevents XSS and injection attacks
6. **CORS Configuration**: Controlled cross-origin access
7. **Password Hashing**: bcrypt for secure password storage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub.
