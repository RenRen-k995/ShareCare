# MVC Architecture Workflow

This document describes the Model-View-Controller (MVC) architecture workflow implemented in ShareCare. The project uses a layered architecture pattern with clear separation of concerns.

## Architecture Overview

ShareCare implements a **PatternCraft Architecture** which extends the traditional MVC pattern with additional layers for better maintainability and testability:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT                                      │
│                    (React Frontend / Mobile App)                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP/WebSocket
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                     │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                           ROUTES                                   │  │
│  │              (API Endpoint Definitions)                            │  │
│  │         /api/auth, /api/posts, /api/chat, etc.                    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                    │                                     │
│                                    ▼                                     │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                         MIDDLEWARE                                 │  │
│  │        (Auth, Upload, Rate Limiting, Error Handling)              │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                    │                                     │
│                                    ▼                                     │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                        CONTROLLERS                                 │  │
│  │              (Request Handling & Response)                         │  │
│  │     AuthController, PostController, ChatController, etc.          │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                    │                                     │
│                                    ▼                                     │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                         SERVICES                                   │  │
│  │              (Business Logic Layer)                                │  │
│  │      AuthService, PostService, ChatService, etc.                  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                    │                                     │
│                                    ▼                                     │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                       REPOSITORIES                                 │  │
│  │              (Data Access Layer)                                   │  │
│  │    UserRepository, PostRepository, ChatRepository, etc.           │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                    │                                     │
│                                    ▼                                     │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                          MODELS                                    │  │
│  │              (Mongoose Schemas & Validation)                       │  │
│  │        User, Post, Chat, Message, Comment, Report, Exchange       │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                    │                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                             DATABASE                                     │
│                            (MongoDB)                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Layer Responsibilities

### 1. Routes Layer (`/src/routes/`)

Defines API endpoints and connects them to controllers.

**Files:**
- `authRoutes.js` - Authentication endpoints
- `postRoutes.js` - Post CRUD endpoints
- `chatRoutes.js` - Chat and messaging endpoints
- `commentRoutes.js` - Comment endpoints
- `reportRoutes.js` - Report endpoints
- `adminRoutes.js` - Admin panel endpoints
- `exchangeRoutes.js` - Exchange tracking endpoints

**Example:**
```javascript
// postRoutes.js
import express from 'express';
import PostController from '../controllers/PostController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', PostController.getPosts);
router.get('/:id', PostController.getPost);
router.post('/', protect, PostController.createPost);
router.put('/:id', protect, PostController.updatePost);
router.delete('/:id', protect, PostController.deletePost);

export default router;
```

---

### 2. Middleware Layer (`/src/middleware/`)

Handles cross-cutting concerns before requests reach controllers.

**Components:**
- **authMiddleware.js** - JWT token verification, user authentication
- **uploadMiddleware.js** - File upload handling with Multer
- **rateLimiter.js** - Rate limiting to prevent abuse
- **errorHandler.js** - Centralized error handling

**Example Flow:**
```
Request → authMiddleware (verify JWT) → uploadMiddleware (handle files) → Controller
```

---

### 3. Controllers Layer (`/src/controllers/`)

Handles HTTP requests, validates input, and formats responses.

**Files:**
- `AuthController.js` - User registration, login, profile
- `PostController.js` - Post CRUD operations
- `ChatController.js` - Chat and messaging
- `CommentController.js` - Comment operations
- `ReportController.js` - Report handling
- `AdminController.js` - Admin operations
- `ExchangeController.js` - Exchange tracking

**Responsibilities:**
- Parse and validate request data
- Call appropriate service methods
- Format and send HTTP responses
- Handle errors with appropriate status codes

**Example:**
```javascript
// PostController.js
class PostController {
  async createPost(req, res, next) {
    try {
      const { title, description, category } = req.body;
      
      // Validation
      if (!title || !description || !category) {
        return res.status(400).json({ 
          message: "Title, description, and category are required" 
        });
      }
      
      // Delegate to service layer
      const post = await PostService.createPost(postData, req.user.id);
      
      // Send response
      res.status(201).json({ message: "Post created successfully", post });
    } catch (error) {
      next(error);
    }
  }
}
```

---

### 4. Services Layer (`/src/services/`)

Contains business logic and orchestrates operations.

**Files:**
- `AuthService.js` - Authentication logic, JWT handling
- `PostService.js` - Post business logic
- `ChatService.js` - Chat and messaging logic
- `CommentService.js` - Comment business logic
- `ReportService.js` - Report processing
- `ExchangeService.js` - Exchange workflow logic

**Responsibilities:**
- Implement business rules
- Coordinate between multiple repositories
- Handle complex operations and transactions
- Transform data between layers

**Example:**
```javascript
// PostService.js
class PostService {
  async toggleReaction(postId, userId, reactionType = "like") {
    // Get post from repository
    const post = await PostRepository.findById(postId);
    if (!post) throw new Error("Post not found");
    
    // Business logic: check existing reaction
    const existingReaction = post.reactions.find(
      (r) => r.user.toString() === userId
    );
    
    let updatedPost;
    if (existingReaction) {
      // Remove reaction
      updatedPost = await PostRepository.removeReaction(postId, userId);
      // Update user's total likes
      await User.findByIdAndUpdate(post.author._id, { $inc: { totalLikes: -1 } });
    } else {
      // Add reaction
      updatedPost = await PostRepository.addReaction(postId, userId, reactionType);
      await User.findByIdAndUpdate(post.author._id, { $inc: { totalLikes: 1 } });
    }
    
    return await PostRepository.findById(postId);
  }
}
```

---

### 5. Repositories Layer (`/src/repositories/`)

Handles all database operations and queries.

**Files:**
- `UserRepository.js` - User data access
- `PostRepository.js` - Post data access
- `ChatRepository.js` - Chat data access
- `CommentRepository.js` - Comment data access
- `ReportRepository.js` - Report data access
- `ExchangeRepository.js` - Exchange data access

**Responsibilities:**
- Execute database queries
- Handle pagination and sorting
- Implement data access patterns
- Abstract database operations from business logic

**Example:**
```javascript
// PostRepository.js
class PostRepository {
  async findById(id) {
    return await Post.findById(id)
      .populate("author", "username fullName avatar totalLikes bio");
  }
  
  async findAll(query = {}, options = {}) {
    const { page = 1, limit = 10, sort = "-createdAt" } = options;
    const skip = (page - 1) * limit;
    
    const posts = await Post.find(query)
      .populate("author", "username fullName avatar")
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    const total = await Post.countDocuments(query);
    return { posts, total, page, pages: Math.ceil(total / limit) };
  }
  
  async addReaction(postId, userId, reactionType) {
    return await Post.findByIdAndUpdate(
      postId,
      { $push: { reactions: { user: userId, type: reactionType } } },
      { new: true }
    ).populate("author", "username fullName avatar");
  }
}
```

---

### 6. Models Layer (`/src/models/`)

Defines database schemas and data validation.

**Files:**
- `User.js` - User schema
- `Post.js` - Post schema
- `Chat.js` - Chat and Message schemas
- `Comment.js` - Comment schema
- `Report.js` - Report schema
- `Exchange.js` - Exchange schema

**Responsibilities:**
- Define document structure
- Implement validation rules
- Define indexes for performance
- Implement hooks (pre-save, post-save)
- Define instance and static methods

---

## Request Flow Example

### Creating a Post

```
1. CLIENT: POST /api/posts with { title, description, category }
                    │
                    ▼
2. ROUTES: postRoutes.js matches route, applies middleware
   - protect middleware verifies JWT token
   - uploadMiddleware handles image upload
                    │
                    ▼
3. CONTROLLER: PostController.createPost()
   - Validates required fields
   - Extracts data from request
   - Calls PostService.createPost()
                    │
                    ▼
4. SERVICE: PostService.createPost()
   - Applies business rules
   - Prepares data for database
   - Calls PostRepository.create()
                    │
                    ▼
5. REPOSITORY: PostRepository.create()
   - Creates new Post document
   - Saves to MongoDB
   - Returns created post
                    │
                    ▼
6. DATABASE: MongoDB stores document
                    │
                    ▼
7. RESPONSE: Flows back through layers
   - Repository returns post
   - Service may transform data
   - Controller formats response
   - Client receives JSON response
```

---

## Real-time Communication (Socket.IO)

Socket.IO events follow a similar pattern but bypass the HTTP route layer:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SOCKET.IO SERVER                                 │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    EVENT HANDLERS                                   │ │
│  │                                                                     │ │
│  │  connection → authenticate → join rooms → listen for events        │ │
│  │                                                                     │ │
│  │  Events:                                                            │ │
│  │  - message:send → ChatService.sendMessage() → broadcast            │ │
│  │  - message:read → ChatService.markAsRead() → notify                │ │
│  │  - typing:start/stop → broadcast to room                           │ │
│  │  - message:react → ChatService.addReaction() → broadcast           │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

The React frontend follows a similar layered pattern:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React)                                │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                         PAGES                                       │ │
│  │         (Home, PostDetail, Chat, AdminPanel, Profile)              │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                               │                                          │
│                               ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                       COMPONENTS                                    │ │
│  │      (ChatList, ChatWindow, PostCard, CommentSection)              │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                               │                                          │
│                               ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                        CONTEXTS                                     │ │
│  │              (AuthContext, SocketContext)                          │ │
│  │         Global state management and Socket.IO client               │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                               │                                          │
│                               ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                        SERVICES                                     │ │
│  │              (API service functions via Axios)                     │ │
│  │      postService, authService, chatService, adminService          │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                               │                                          │
│                               ▼                                          │
│                         HTTP/WebSocket                                   │
│                               │                                          │
└───────────────────────────────┼─────────────────────────────────────────┘
                                │
                                ▼
                            BACKEND
```

---

## Benefits of This Architecture

1. **Separation of Concerns** - Each layer has a specific responsibility
2. **Testability** - Layers can be tested independently with mocks
3. **Maintainability** - Changes in one layer don't affect others
4. **Scalability** - Easy to add new features without breaking existing code
5. **Reusability** - Services and repositories can be reused across controllers
6. **Clear Data Flow** - Predictable request/response flow

---

## File Structure Summary

```
backend/
├── src/
│   ├── config/          # Database & Socket.IO configuration
│   ├── controllers/     # Request handlers (Controller layer)
│   │   ├── AuthController.js
│   │   ├── PostController.js
│   │   ├── ChatController.js
│   │   ├── CommentController.js
│   │   ├── ReportController.js
│   │   ├── AdminController.js
│   │   └── ExchangeController.js
│   ├── middleware/      # Cross-cutting concerns
│   │   ├── authMiddleware.js
│   │   ├── uploadMiddleware.js
│   │   ├── rateLimiter.js
│   │   └── errorHandler.js
│   ├── models/          # Mongoose schemas (Model layer)
│   │   ├── User.js
│   │   ├── Post.js
│   │   ├── Chat.js
│   │   ├── Comment.js
│   │   ├── Report.js
│   │   └── Exchange.js
│   ├── repositories/    # Data access layer
│   │   ├── UserRepository.js
│   │   ├── PostRepository.js
│   │   ├── ChatRepository.js
│   │   ├── CommentRepository.js
│   │   ├── ReportRepository.js
│   │   └── ExchangeRepository.js
│   ├── routes/          # API route definitions
│   │   ├── authRoutes.js
│   │   ├── postRoutes.js
│   │   ├── chatRoutes.js
│   │   ├── commentRoutes.js
│   │   ├── reportRoutes.js
│   │   ├── adminRoutes.js
│   │   └── exchangeRoutes.js
│   ├── services/        # Business logic layer
│   │   ├── AuthService.js
│   │   ├── PostService.js
│   │   ├── ChatService.js
│   │   ├── CommentService.js
│   │   ├── ReportService.js
│   │   └── ExchangeService.js
│   ├── utils/           # Utility functions
│   └── server.js        # Application entry point

frontend/
├── src/
│   ├── components/      # Reusable UI components (View layer)
│   │   ├── chat/
│   │   └── ui/
│   ├── contexts/        # React Context providers
│   ├── pages/           # Page components
│   ├── services/        # API service functions
│   ├── lib/             # Utilities
│   └── main.jsx         # Entry point
```
