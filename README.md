# ShareCare

ShareCare is a community platform where users can share items, knowledge, or emotional support with each other.

## Features

- **User Authentication**: Register, login, and manage user profiles with JWT-based authentication
- **Post Management**: Create, view, edit, and delete posts with categories (items, knowledge, emotional support)
- **Post Status Tracking**: Track post status (available, pending, donated, closed)
- **Image Upload**: Upload images with posts
- **Reactions**: React to posts with likes/hearts
- **Comments**: Comment on posts to engage with the community
- **Search & Filter**: Search posts and filter by category and status
- **Chat System**: Real-time messaging between users for arranging exchanges
- **Admin Panel**: Admin tools to manage reports and moderate content
- **Report System**: Users can report violations with proper admin review workflow

## Tech Stack

### Backend
- Node.js + Express.js
- MongoDB + Mongoose ODM
- JWT Authentication
- Multer for file uploads
- PatternCraft Architecture (Models, Repositories, Services, Controllers)

### Frontend
- React 19
- Vite
- TailwindCSS
- shadcn/ui components
- React Router
- Axios

## Project Structure

```
ShareCare/
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── models/          # Mongoose models
│   │   ├── repositories/    # Data access layer
│   │   ├── services/        # Business logic layer
│   │   ├── controllers/     # Request handlers
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Auth, upload, error handling
│   │   └── server.js        # Entry point
│   ├── uploads/             # Uploaded files
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── contexts/        # React contexts
│   │   ├── services/        # API service functions
│   │   ├── lib/             # Utilities
│   │   └── main.jsx         # Entry point
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (running locally or remote instance)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sharecare
JWT_SECRET=your_secure_secret_key
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

5. Start the backend server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The backend API will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Update the `.env` file:
```
VITE_API_URL=http://localhost:5000/api
```

5. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update user profile (protected)

### Posts
- `GET /api/posts` - Get all posts (with filters)
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create new post (protected)
- `PUT /api/posts/:id` - Update post (protected)
- `DELETE /api/posts/:id` - Delete post (protected)
- `PATCH /api/posts/:id/status` - Update post status (protected)
- `POST /api/posts/:id/reaction` - Toggle reaction (protected)

### Comments
- `GET /api/comments/post/:postId` - Get comments for a post
- `POST /api/comments` - Create comment (protected)
- `PUT /api/comments/:id` - Update comment (protected)
- `DELETE /api/comments/:id` - Delete comment (protected)

### Chat
- `POST /api/chat/chat` - Get or create chat (protected)
- `GET /api/chat/chats` - Get user's chats (protected)
- `POST /api/chat/message` - Send message (protected)
- `GET /api/chat/chat/:chatId/messages` - Get chat messages (protected)

### Reports
- `POST /api/reports` - Create report (protected)
- `GET /api/reports` - Get all reports (admin only)
- `GET /api/reports/:id` - Get single report (admin only)
- `PATCH /api/reports/:id/status` - Update report status (admin only)
- `DELETE /api/reports/:id` - Delete report (admin only)

## Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Browse Posts**: View community posts on the home page
3. **Filter & Search**: Use filters to find specific types of posts
4. **Create Post**: Click "New Post" to share items, knowledge, or support
5. **Interact**: React to posts, add comments, and engage with the community
6. **Manage Posts**: Update post status as items are donated or transactions complete
7. **Report Issues**: Report inappropriate content for admin review

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Protected routes and endpoints
- Input validation
- File upload restrictions
- Admin role management

## License

ISC