# Database Schema

This document describes the MongoDB database schema for the ShareCare application - a complete community platform for sharing items, knowledge, and emotional support.

## Overview

ShareCare uses MongoDB with Mongoose ODM. The database architecture supports:

- **User Management** - Registration, authentication, profiles, and admin capabilities
- **Content Management** - Posts, comments, and reactions
- **Real-time Communication** - Chat and messaging system
- **Moderation System** - Reports and admin review workflow
- **Exchange Tracking** - Item donation lifecycle management

### Collections Summary

| Collection | Purpose | Key Features |
|------------|---------|--------------|
| **Users** | User accounts and profiles | Authentication, admin roles, ratings |
| **Posts** | Shared content (items, knowledge, support) | Categories, status tracking, reactions |
| **Comments** | User interactions on posts | Nested discussions, likes |
| **Chats** | Conversation threads | Real-time messaging, unread counts |
| **Messages** | Individual chat messages | File attachments, read receipts |
| **Reports** | Content moderation | Admin review workflow |
| **Exchanges** | Item donation tracking | Full lifecycle management |

---

## Database Setup

### Quick Setup

1. **Initialize database with admin user:**
   ```bash
   cd backend
   npm run seed
   ```

2. **Initialize with sample data (for testing):**
   ```bash
   cd backend
   npm run seed:sample
   ```

### Default Admin Credentials

After running the seed script or starting the server for the first time, a default admin user will be created:

| Field | Value |
|-------|-------|
| Email | admin@sharecare.com |
| Password | Admin@123456 |
| Username | admin |

**⚠️ IMPORTANT: Change these credentials in production!**

Configure via environment variables:
```env
ADMIN_EMAIL=your-admin@domain.com
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=YourSecurePassword123!
```

### Auto-initialization

When the server starts, it automatically checks if an admin user exists. If not, it creates the default admin user. This ensures the application always has at least one admin account for moderation purposes.

---

## Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                              SHARECARE DATABASE SCHEMA                                    │
│                           MongoDB + Mongoose ODM Architecture                             │
└──────────────────────────────────────────────────────────────────────────────────────────┘

                                    ┌─────────────────────┐
                                    │        USER         │
                                    │   (Central Entity)  │
                                    ├─────────────────────┤
                                    │ _id: ObjectId (PK)  │
                                    │ username: String    │
                                    │ email: String       │
                                    │ password: String    │◄─── bcrypt hashed
                                    │ fullName: String    │
                                    │ avatar: String      │
                                    │ bio: String         │
                                    │ gender: Enum        │
                                    │ dateOfBirth: Date   │
                                    │ rating: Number      │◄─── 0-5 stars
                                    │ ratingCount: Number │
                                    │ totalLikes: Number  │
                                    │ ╔═══════════════╗   │
                                    │ ║ isAdmin: Bool ║   │◄─── ADMIN FLAG
                                    │ ╚═══════════════╝   │
                                    │ isBlocked: Boolean  │◄─── Account status
                                    │ createdAt: Date     │
                                    │ updatedAt: Date     │
                                    └─────────┬───────────┘
                                              │
          ┌───────────────────────────────────┼───────────────────────────────────┐
          │                                   │                                   │
          ▼                                   ▼                                   ▼
┌─────────────────────┐           ┌─────────────────────┐           ┌─────────────────────┐
│        POST         │           │        CHAT         │           │       REPORT        │
│   (Content Entity)  │           │  (Communication)    │           │   (Moderation)      │
├─────────────────────┤           ├─────────────────────┤           ├─────────────────────┤
│ _id: ObjectId (PK)  │           │ _id: ObjectId (PK)  │           │ _id: ObjectId (PK)  │
│ title: String       │           │ participants: [User]│◄──────────│ post: ObjectId (FK) │──┐
│ description: String │           │ lastMessage: Message│           │ reporter: User (FK) │  │
│ category: Enum      │◄──┐       │ post: ObjectId (FK) │───────────│ reason: Enum        │  │
│  - items            │   │       │ unreadCount: Map    │           │ description: String │  │
│  - knowledge        │   │       │ updatedAt: Date     │           │ status: Enum        │  │
│  - emotional-support│   │       │ createdAt: Date     │           │  - pending          │  │
│  - other            │   │       └─────────┬───────────┘           │  - reviewed         │  │
│ status: Enum        │   │                 │                       │  - resolved         │  │
│  - available        │   │                 │ 1:N                   │  - dismissed        │  │
│  - pending          │   │                 ▼                       │ ╔═════════════════╗ │  │
│  - donated          │   │       ┌─────────────────────┐           │ ║ reviewedBy: User║ │◄─┼── ADMIN
│  - closed           │   │       │      MESSAGE        │           │ ╚═════════════════╝ │  │   REVIEWS
│ image: String       │   │       │  (Chat Messages)    │           │ reviewNotes: String │  │
│ contentImages: []   │   │       ├─────────────────────┤           │ createdAt: Date     │  │
│ author: User (FK)   │───┤       │ _id: ObjectId (PK)  │           └─────────────────────┘  │
│ reactions: [{       │   │       │ chat: ObjectId (FK) │◄──┘                                │
│   user: User,       │   │       │ sender: User (FK)   │                                    │
│   type: Enum        │   │       │ content: String     │                                    │
│ }]                  │   │       │ messageType: Enum   │                                    │
│ viewCount: Number   │   │       │  - text             │                                    │
│ viewedBy: [User]    │   │       │  - file             │                                    │
│ createdAt: Date     │   │       │  - image            │                                    │
│ updatedAt: Date     │   │       │ fileUrl: String     │                                    │
└─────────┬───────────┘   │       │ fileName: String    │                                    │
          │               │       │ fileSize: Number    │                                    │
          │ 1:N           │       │ readBy: [{          │                                    │
          ▼               │       │   user: User,       │                                    │
┌─────────────────────┐   │       │   readAt: Date      │                                    │
│      COMMENT        │   │       │ }]                  │                                    │
│  (Post Interactions)│   │       │ reactions: [{       │                                    │
├─────────────────────┤   │       │   user: User,       │                                    │
│ _id: ObjectId (PK)  │   │       │   emoji: String     │                                    │
│ post: ObjectId (FK) │───┘       │ }]                  │                                    │
│ author: User (FK)   │           │ isDelivered: Bool   │                                    │
│ content: String     │           │ deliveredAt: Date   │                                    │
│ likes: [User]       │           │ isDeleted: Bool     │                                    │
│ createdAt: Date     │           │ deletedAt: Date     │                                    │
│ updatedAt: Date     │           │ deletedBy: User     │                                    │
└─────────────────────┘           │ createdAt: Date     │                                    │
                                  │ updatedAt: Date     │                                    │
                                  └─────────────────────┘                                    │
                                                                                             │
┌────────────────────────────────────────────────────────────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                      EXCHANGE                                               │
│                            (Item Donation Lifecycle Tracking)                               │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ _id: ObjectId (PK)                                                                          │
│ chat: ObjectId (FK) ──────► Chat                                                            │
│ post: ObjectId (FK) ──────► Post                                                            │
│ giver: ObjectId (FK) ─────► User (item owner)                                               │
│ receiver: ObjectId (FK) ──► User (item recipient)                                           │
│                                                                                             │
│ status: Enum                          │ meetingDetails: {                                   │
│  - requested  ──► Initial request     │   scheduledTime: Date                               │
│  - accepted   ──► Giver approved      │   location: {                                       │
│  - scheduled  ──► Meeting arranged    │     address: String                                 │
│  - in_progress ─► Exchange ongoing    │     coordinates: { lat, lng }                       │
│  - completed  ──► Success             │   }                                                 │
│  - cancelled  ──► Cancelled           │   method: Enum (pickup/delivery/meet_halfway)       │
│  - declined   ──► Giver rejected      │   notes: String                                     │
│                                       │ }                                                   │
│ statusHistory: [{                     │                                                     │
│   status, timestamp, updatedBy, note  │ rating: {                                           │
│ }]                                    │   giverRating: { score, feedback, ratedAt }         │
│                                       │   receiverRating: { score, feedback, ratedAt }      │
│ cancelledBy: User (FK)                │ }                                                   │
│ cancelReason: String                  │                                                     │
│ createdAt: Date                       │                                                     │
│ updatedAt: Date                       │                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════════════════════
                                    LEGEND & RELATIONSHIPS
═══════════════════════════════════════════════════════════════════════════════════════════════

    ┌─────┐                           ┌─────┐
    │  A  │──────────────────────────►│  B  │     A references B (Foreign Key)
    └─────┘                           └─────┘

    ┌─────┐                           ┌─────┐
    │  A  │◄─────────────────────────►│  B  │     Bidirectional relationship
    └─────┘                           └─────┘

    ╔═════════════════╗
    ║  Special Field  ║                           Admin-related field (highlighted)
    ╚═════════════════╝

    (PK) = Primary Key
    (FK) = Foreign Key
    1:N  = One-to-Many relationship
    N:M  = Many-to-Many relationship

═══════════════════════════════════════════════════════════════════════════════════════════════
```

---

## Admin System

### Admin Capabilities

The admin user (`isAdmin: true`) has special privileges:

| Feature | Description |
|---------|-------------|
| **Report Management** | View all reports, update status, add review notes |
| **Post Moderation** | Hide or delete any post, change post status |
| **User Management** | Block/unblock users, view all user data |
| **Statistics Dashboard** | View platform analytics and metrics |
| **Comment Moderation** | Delete inappropriate comments |

### Admin Workflow

```
User Reports Post
       │
       ▼
┌─────────────────┐
│ Report Created  │
│ status: pending │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│        ADMIN REVIEWS REPORT         │
│  - Reviews post content             │
│  - Reviews report reason            │
│  - Decides action                   │
└────────┬────────────────────────────┘
         │
    ┌────┴────┬─────────────┬─────────────┐
    │         │             │             │
    ▼         ▼             ▼             ▼
┌───────┐ ┌───────┐   ┌───────────┐ ┌─────────┐
│Dismiss│ │Resolve│   │ Hide Post │ │ Delete  │
│Report │ │Report │   │(status=   │ │  Post   │
└───────┘ └───────┘   │ closed)   │ └─────────┘
                      └───────────┘

Optional: Block user if severe violation
```

---

## Collections

### User

Stores user account information, profiles, and admin status.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `_id` | ObjectId | Auto | - | Unique identifier |
| `username` | String | Yes | - | Unique username (3-30 chars) |
| `email` | String | Yes | - | Unique email (lowercase) |
| `password` | String | Yes | - | Hashed password (min 6 chars) |
| `fullName` | String | No | - | User's full name |
| `avatar` | String | No | "" | Profile picture URL |
| `bio` | String | No | "" | User biography (max 500 chars) |
| `gender` | String | No | "" | Gender (male/female/other/prefer-not-to-say) |
| `dateOfBirth` | Date | No | null | Date of birth |
| `rating` | Number | No | 0 | User rating (0-5) |
| `ratingCount` | Number | No | 0 | Number of ratings received |
| `totalLikes` | Number | No | 0 | Total likes received across all posts |
| `isAdmin` | Boolean | No | false | **Admin status - grants moderation privileges** |
| `isBlocked` | Boolean | No | false | Blocked status - prevents login and actions |
| `createdAt` | Date | No | Date.now | Account creation timestamp |
| `updatedAt` | Date | Auto | - | Last update timestamp |

**Indexes:**
- Unique index on `username`
- Unique index on `email`

**Hooks:**
- Pre-save: Passwords are hashed using bcrypt (10 salt rounds)

**Methods:**
- `comparePassword(candidatePassword)`: Validates password against hash
- `toPublicJSON()`: Returns safe user data without password

---

### Post

Stores shared items, knowledge, and emotional support posts.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `_id` | ObjectId | Auto | - | Unique identifier |
| `title` | String | Yes | - | Post title (max 200 chars) |
| `description` | String | Yes | - | Post content (max 10000 chars) |
| `category` | String | Yes | "other" | Category (items/knowledge/emotional-support/other) |
| `status` | String | No | "available" | Status (available/pending/donated/closed) |
| `image` | String | No | "" | Featured image URL |
| `contentImages` | [String] | No | [] | Array of inline image URLs |
| `author` | ObjectId | Yes | - | Reference to User |
| `reactions` | Array | No | [] | Array of reaction objects |
| `reactions.user` | ObjectId | - | - | User who reacted |
| `reactions.type` | String | - | "like" | Reaction type (like/heart/helpful) |
| `viewCount` | Number | No | 0 | Number of views |
| `viewedBy` | [ObjectId] | No | [] | Users who viewed the post |
| `createdAt` | Date | No | Date.now | Creation timestamp |
| `updatedAt` | Date | Auto | - | Last update timestamp |

**Category Values:**
| Value | Description |
|-------|-------------|
| `items` | Physical items for donation |
| `knowledge` | Educational content, tutorials, tips |
| `emotional-support` | Mental health support, encouragement |
| `other` | Miscellaneous content |

**Status Values:**
| Value | Description |
|-------|-------------|
| `available` | Post is active and accepting requests |
| `pending` | Exchange in progress |
| `donated` | Item successfully donated |
| `closed` | Post closed (by user or admin) |

**Indexes:**
- Text index on `title` and `description` for search
- Compound index on `category`, `status`, `createdAt`

---

### Chat

Stores chat conversations between users.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `_id` | ObjectId | Auto | - | Unique identifier |
| `participants` | [ObjectId] | Yes | - | Array of User references (2 users) |
| `lastMessage` | ObjectId | No | - | Reference to last Message |
| `post` | ObjectId | No | - | Reference to related Post |
| `unreadCount` | Map<String, Number> | No | {} | Unread count per user ID |
| `updatedAt` | Date | No | Date.now | Last update timestamp |
| `createdAt` | Date | Auto | - | Creation timestamp |

**Indexes:**
- Compound index on `participants` and `updatedAt`

---

### Message

Stores individual messages within chats.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `_id` | ObjectId | Auto | - | Unique identifier |
| `chat` | ObjectId | Yes | - | Reference to Chat |
| `sender` | ObjectId | Yes | - | Reference to User |
| `content` | String | No | - | Message text (max 2000 chars) |
| `messageType` | String | No | "text" | Type (text/file/image) |
| `fileUrl` | String | No | - | File URL for attachments |
| `fileName` | String | No | - | Original file name |
| `fileSize` | Number | No | - | File size in bytes |
| `readBy` | Array | No | [] | Array of read receipts |
| `readBy.user` | ObjectId | - | - | User who read |
| `readBy.readAt` | Date | - | Date.now | Read timestamp |
| `reactions` | Array | No | [] | Message reactions |
| `reactions.user` | ObjectId | - | - | User who reacted |
| `reactions.emoji` | String | - | - | Emoji reaction |
| `isDelivered` | Boolean | No | false | Delivery status |
| `deliveredAt` | Date | No | - | Delivery timestamp |
| `isDeleted` | Boolean | No | false | Soft delete flag |
| `deletedAt` | Date | No | - | Deletion timestamp |
| `deletedBy` | ObjectId | No | - | User who deleted |
| `createdAt` | Date | No | Date.now | Creation timestamp |
| `updatedAt` | Date | Auto | - | Last update timestamp |

**Indexes:**
- Compound index on `chat` and `createdAt`
- Compound index on `isDelivered` and `readBy.user`

---

### Comment

Stores comments on posts.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `_id` | ObjectId | Auto | - | Unique identifier |
| `post` | ObjectId | Yes | - | Reference to Post |
| `author` | ObjectId | Yes | - | Reference to User |
| `content` | String | Yes | - | Comment text (max 1000 chars) |
| `likes` | [ObjectId] | No | [] | Array of User references who liked |
| `createdAt` | Date | No | Date.now | Creation timestamp |
| `updatedAt` | Date | Auto | - | Last update timestamp |

**Indexes:**
- Compound index on `post` and `createdAt`

---

### Report

Stores user reports on posts for admin moderation.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `_id` | ObjectId | Auto | - | Unique identifier |
| `post` | ObjectId | Yes | - | Reference to reported Post |
| `reporter` | ObjectId | Yes | - | Reference to reporting User |
| `reason` | String | Yes* | "other" | Reason (spam/inappropriate/scam/harassment/other) |
| `description` | String | No | - | Additional details (max 500 chars) |
| `status` | String | No | "pending" | Status (pending/reviewed/resolved/dismissed) |
| `reviewedBy` | ObjectId | No | - | **Admin who reviewed** |
| `reviewNotes` | String | No | - | Admin notes (max 500 chars) |
| `createdAt` | Date | No | Date.now | Creation timestamp |
| `updatedAt` | Date | Auto | - | Last update timestamp |

*Note: The `reason` field is required but has a default value of "other" which is used when no value is provided.

**Report Reason Values:**
| Value | Description |
|-------|-------------|
| `spam` | Unsolicited promotional content |
| `inappropriate` | Offensive or inappropriate content |
| `scam` | Fraudulent or deceptive content |
| `harassment` | Targeting or harassing users |
| `other` | Other violations |

**Report Status Values:**
| Value | Description |
|-------|-------------|
| `pending` | Awaiting admin review |
| `reviewed` | Admin has seen the report |
| `resolved` | Issue has been addressed |
| `dismissed` | Report was invalid/unfounded |

**Indexes:**
- Compound index on `status` and `createdAt`

---

### Exchange

Tracks item exchanges between users with full lifecycle management.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `_id` | ObjectId | Auto | - | Unique identifier |
| `chat` | ObjectId | Yes | - | Reference to Chat |
| `post` | ObjectId | Yes | - | Reference to Post |
| `giver` | ObjectId | Yes | - | Reference to giving User (post author) |
| `receiver` | ObjectId | Yes | - | Reference to receiving User |
| `status` | String | No | "requested" | Exchange status |
| `meetingDetails` | Object | No | - | Meeting arrangement details |
| `meetingDetails.scheduledTime` | Date | No | - | Meeting time |
| `meetingDetails.location` | Object | No | - | Meeting location |
| `meetingDetails.location.address` | String | No | - | Address |
| `meetingDetails.location.coordinates` | Object | No | - | GPS coordinates |
| `meetingDetails.method` | String | No | - | Method (pickup/delivery/meet_halfway) |
| `meetingDetails.notes` | String | No | - | Additional notes |
| `statusHistory` | Array | No | [] | Status change history |
| `rating` | Object | No | - | Mutual ratings |
| `rating.giverRating` | Object | No | - | Rating from receiver to giver |
| `rating.receiverRating` | Object | No | - | Rating from giver to receiver |
| `cancelledBy` | ObjectId | No | - | User who cancelled |
| `cancelReason` | String | No | - | Cancellation reason |
| `createdAt` | Date | Auto | - | Creation timestamp |
| `updatedAt` | Date | Auto | - | Last update timestamp |

**Exchange Status Values:**
| Status | Description | Next States |
|--------|-------------|-------------|
| `requested` | Initial request sent | accepted, declined |
| `accepted` | Giver accepted the request | scheduled, cancelled |
| `scheduled` | Meeting time/location set | in_progress, cancelled |
| `in_progress` | Item being exchanged | completed, cancelled |
| `completed` | Exchange successful | (final) |
| `cancelled` | Cancelled by either party | (final) |
| `declined` | Giver declined the request | (final) |

**Exchange Lifecycle Diagram:**
```
┌───────────┐     accept      ┌──────────┐    schedule    ┌───────────┐
│ requested │────────────────►│ accepted │───────────────►│ scheduled │
└─────┬─────┘                 └────┬─────┘                └─────┬─────┘
      │                            │                            │
      │ decline                    │ cancel                     │ start
      ▼                            ▼                            ▼
┌──────────┐                 ┌───────────┐              ┌─────────────┐
│ declined │                 │ cancelled │◄─────────────│ in_progress │
└──────────┘                 └───────────┘     cancel   └──────┬──────┘
                                   ▲                           │
                                   │                           │ complete
                                   │                           ▼
                                   │                    ┌───────────┐
                                   └────────────────────│ completed │
                                          cancel        └───────────┘
```

**Indexes:**
- Index on `chat`
- Index on `post`
- Compound index on `giver` and `status`
- Compound index on `receiver` and `status`
- Compound index on `status` and `createdAt`

**Hooks:**
- Pre-save: Automatically adds status changes to statusHistory

---

## Relationships Summary

| From | To | Type | Description |
|------|----|----|-------------|
| Post | User | Many-to-One | Post author |
| Post | User | Many-to-Many | Post reactions, viewedBy |
| Comment | Post | Many-to-One | Comment belongs to post |
| Comment | User | Many-to-One | Comment author |
| Comment | User | Many-to-Many | Comment likes |
| Chat | User | Many-to-Many | Chat participants (2 users) |
| Chat | Post | Many-to-One | Related post (optional) |
| Chat | Message | One-to-One | Last message reference |
| Message | Chat | Many-to-One | Message belongs to chat |
| Message | User | Many-to-One | Message sender |
| Message | User | Many-to-Many | Read receipts, reactions |
| Report | Post | Many-to-One | Reported post |
| Report | User | Many-to-One | Reporter |
| Report | User | Many-to-One | **Admin reviewer (reviewedBy)** |
| Exchange | Chat | One-to-One | Related chat |
| Exchange | Post | One-to-One | Item being exchanged |
| Exchange | User | Many-to-One | Giver (post author) |
| Exchange | User | Many-to-One | Receiver (requester) |

---

## Database Statistics & Admin Dashboard

The admin dashboard provides real-time statistics:

| Metric | Description | Collection |
|--------|-------------|------------|
| Total Users | All registered users | Users |
| Active Users | Users active in last 30 days | Users (derived) |
| Blocked Users | Users with `isBlocked: true` | Users |
| Total Posts | All posts created | Posts |
| Available Posts | Posts with `status: available` | Posts |
| Donated Posts | Successful donations | Posts |
| Posts by Category | Distribution across categories | Posts |
| Pending Reports | Reports awaiting review | Reports |
| Resolved Reports | Addressed reports | Reports |
| Recent Activity | Posts/donations in last 7 days | Posts |

---

## Security Considerations

1. **Password Security**: All passwords are hashed using bcrypt with 10 salt rounds
2. **Admin Access**: Admin privileges controlled via `isAdmin` flag
3. **User Blocking**: `isBlocked` flag prevents user actions
4. **Soft Deletes**: Messages support soft deletion for audit trails
5. **Data Validation**: Mongoose schemas enforce data integrity
6. **Index Optimization**: Strategic indexes for query performance
