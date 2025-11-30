# Database Schema

This document describes the MongoDB database schema for the ShareCare application.

## Overview

ShareCare uses MongoDB with Mongoose ODM. The database consists of the following collections:

- **Users** - User accounts and profiles
- **Posts** - Shared items, knowledge, and emotional support posts
- **Chats** - Chat conversations between users
- **Messages** - Individual messages within chats
- **Comments** - Comments on posts
- **Reports** - User reports on posts
- **Exchanges** - Item exchange tracking between users

---

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │       │    Post     │       │   Comment   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ _id         │◄──────┤ author      │       │ _id         │
│ username    │       │ _id         │◄──────┤ post        │
│ email       │       │ title       │       │ author      │──────►│ User │
│ password    │       │ description │       │ content     │
│ fullName    │       │ category    │       │ likes[]     │
│ avatar      │       │ status      │       │ createdAt   │
│ bio         │       │ image       │       └─────────────┘
│ gender      │       │ reactions[] │
│ dateOfBirth │       │ viewCount   │       ┌─────────────┐
│ rating      │       │ createdAt   │       │   Report    │
│ ratingCount │       └─────────────┘       ├─────────────┤
│ totalLikes  │              ▲              │ _id         │
│ isAdmin     │              │              │ post        │──────►│ Post │
│ isBlocked   │              │              │ reporter    │──────►│ User │
│ createdAt   │       ┌──────┴──────┐       │ reason      │
└─────────────┘       │             │       │ description │
       ▲              │             │       │ status      │
       │        ┌─────┴─────┐ ┌─────┴─────┐ │ reviewedBy  │
       │        │   Chat    │ │ Exchange  │ │ createdAt   │
       │        ├───────────┤ ├───────────┤ └─────────────┘
       │        │ _id       │ │ _id       │
       └────────┤participants│ │ chat      │──────►│ Chat │
                │ lastMessage│ │ post      │──────►│ Post │
                │ post      │ │ giver     │──────►│ User │
                │ unreadCount│ │ receiver  │──────►│ User │
                │ updatedAt │ │ status    │
                └───────────┘ │ meeting   │
                      │       │ rating    │
                      ▼       └───────────┘
                ┌───────────┐
                │  Message  │
                ├───────────┤
                │ _id       │
                │ chat      │──────►│ Chat │
                │ sender    │──────►│ User │
                │ content   │
                │ messageType│
                │ fileUrl   │
                │ readBy[]  │
                │ reactions[]│
                │ isDelivered│
                │ createdAt │
                └───────────┘
```

---

## Collections

### User

Stores user account information and profiles.

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
| `isAdmin` | Boolean | No | false | Admin status |
| `isBlocked` | Boolean | No | false | Blocked status |
| `createdAt` | Date | No | Date.now | Account creation timestamp |

**Hooks:**
- Pre-save: Passwords are hashed using bcrypt before saving

**Methods:**
- `comparePassword(candidatePassword)`: Validates password
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

**Indexes:**
- Text index on `title` and `description` for search
- Compound index on `category`, `status`, `createdAt`

---

### Chat

Stores chat conversations between users.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `_id` | ObjectId | Auto | - | Unique identifier |
| `participants` | [ObjectId] | Yes | - | Array of User references |
| `lastMessage` | ObjectId | No | - | Reference to last Message |
| `post` | ObjectId | No | - | Reference to related Post |
| `unreadCount` | Map<String, Number> | No | {} | Unread count per user |
| `updatedAt` | Date | No | Date.now | Last update timestamp |

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

**Indexes:**
- Compound index on `post` and `createdAt`

---

### Report

Stores user reports on posts.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `_id` | ObjectId | Auto | - | Unique identifier |
| `post` | ObjectId | Yes | - | Reference to reported Post |
| `reporter` | ObjectId | Yes | - | Reference to reporting User |
| `reason` | String | Yes* | "other" | Reason (spam/inappropriate/scam/harassment/other) |
| `description` | String | No | - | Additional details (max 500 chars) |
| `status` | String | No | "pending" | Status (pending/reviewed/resolved/dismissed) |
| `reviewedBy` | ObjectId | No | - | Admin who reviewed |
| `reviewNotes` | String | No | - | Admin notes (max 500 chars) |
| `createdAt` | Date | No | Date.now | Creation timestamp |

*Note: The `reason` field is required but has a default value of "other" which is used when no value is provided.

**Indexes:**
- Compound index on `status` and `createdAt`

---

### Exchange

Tracks item exchanges between users.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `_id` | ObjectId | Auto | - | Unique identifier |
| `chat` | ObjectId | Yes | - | Reference to Chat |
| `post` | ObjectId | Yes | - | Reference to Post |
| `giver` | ObjectId | Yes | - | Reference to giving User |
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

**Exchange Status Values:**
- `requested` - Initial request sent
- `accepted` - Giver accepted the request
- `scheduled` - Meeting time/location set
- `in_progress` - Item being exchanged
- `completed` - Exchange successful
- `cancelled` - Cancelled by either party
- `declined` - Giver declined the request

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
| Post | User | Many-to-Many | Post reactions |
| Comment | Post | Many-to-One | Comment belongs to post |
| Comment | User | Many-to-One | Comment author |
| Comment | User | Many-to-Many | Comment likes |
| Chat | User | Many-to-Many | Chat participants |
| Chat | Post | Many-to-One | Related post (optional) |
| Chat | Message | One-to-One | Last message |
| Message | Chat | Many-to-One | Message belongs to chat |
| Message | User | Many-to-One | Message sender |
| Message | User | Many-to-Many | Read receipts, reactions |
| Report | Post | Many-to-One | Reported post |
| Report | User | Many-to-One | Reporter, reviewer |
| Exchange | Chat | One-to-One | Related chat |
| Exchange | Post | One-to-One | Item being exchanged |
| Exchange | User | Many-to-One | Giver and receiver |
