# ShareCare Database Relations

## Overview

ShareCare uses MongoDB with Mongoose ODM. This document describes the database schema and entity relationships.

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ShareCare Database Schema                              │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│      USER        │
├──────────────────┤
│ _id (ObjectId)   │◄───────────────────────────────────────────────────────────┐
│ username         │                                                             │
│ email            │                                                             │
│ password         │                                                             │
│ fullName         │                                                             │
│ avatar           │                                                             │
│ bio              │                                                             │
│ gender           │                                                             │
│ dateOfBirth      │                                                             │
│ rating           │                                                             │
│ ratingCount      │                                                             │
│ totalLikes       │                                                             │
│ isAdmin          │                                                             │
│ isBlocked        │                                                             │
│ createdAt        │                                                             │
└──────────────────┘                                                             │
        │                                                                        │
        │ 1:N                                                                    │
        ▼                                                                        │
┌──────────────────┐                                                             │
│      POST        │                                                             │
├──────────────────┤                                                             │
│ _id (ObjectId)   │◄─────────────────────────────────────────────┐              │
│ title            │                                               │              │
│ description      │                                               │              │
│ category         │                                               │              │
│ status           │                                               │              │
│ image            │                                               │              │
│ contentImages[]  │                                               │              │
│ author ──────────┼──► User._id                                   │              │
│ reactions[]      │    (user → User._id)                          │              │
│ viewCount        │                                               │              │
│ viewedBy[] ──────┼──► User._id                                   │              │
│ createdAt        │                                               │              │
└──────────────────┘                                               │              │
        │                                                          │              │
        │ 1:N                                                      │              │
        ▼                                                          │              │
┌──────────────────┐                                               │              │
│    COMMENT       │                                               │              │
├──────────────────┤                                               │              │
│ _id (ObjectId)   │                                               │              │
│ post ────────────┼──► Post._id                                   │              │
│ author ──────────┼──► User._id                                   │              │
│ content          │                                               │              │
│ likes[] ─────────┼──► User._id                                   │              │
│ createdAt        │                                               │              │
└──────────────────┘                                               │              │
                                                                   │              │
┌──────────────────┐                                               │              │
│     REPORT       │                                               │              │
├──────────────────┤                                               │              │
│ _id (ObjectId)   │                                               │              │
│ post ────────────┼──► Post._id ──────────────────────────────────┘              │
│ reporter ────────┼──► User._id                                                  │
│ reason           │                                                              │
│ description      │                                                              │
│ status           │                                                              │
│ reviewedBy ──────┼──► User._id                                                  │
│ reviewNotes      │                                                              │
│ createdAt        │                                                              │
└──────────────────┘                                                              │
                                                                                  │
┌──────────────────┐                                                              │
│      CHAT        │                                                              │
├──────────────────┤                                                              │
│ _id (ObjectId)   │◄─────────────────────────────────────────────┐               │
│ participants[] ──┼──► User._id                                   │               │
│ lastMessage ─────┼──► Message._id                                │               │
│ post ────────────┼──► Post._id                                   │               │
│ unreadCount      │    (Map: userId → count)                      │               │
│ updatedAt        │                                               │               │
└──────────────────┘                                               │               │
        │                                                          │               │
        │ 1:N                                                      │               │
        ▼                                                          │               │
┌──────────────────┐                                               │               │
│    MESSAGE       │                                               │               │
├──────────────────┤                                               │               │
│ _id (ObjectId)   │◄──────────────────────────────────────────────┘               │
│ chat ────────────┼──► Chat._id                                                   │
│ sender ──────────┼──► User._id                                                   │
│ content          │                                                               │
│ messageType      │                                                               │
│ fileUrl          │                                                               │
│ fileName         │                                                               │
│ fileSize         │                                                               │
│ readBy[] ────────┼──► (user → User._id, readAt)                                  │
│ reactions[] ─────┼──► (user → User._id, emoji)                                   │
│ isDelivered      │                                                               │
│ deliveredAt      │                                                               │
│ isDeleted        │                                                               │
│ deletedAt        │                                                               │
│ deletedBy ───────┼──► User._id                                                   │
│ createdAt        │                                                               │
└──────────────────┘                                                               │
                                                                                   │
┌──────────────────┐                                                               │
│    EXCHANGE      │                                                               │
├──────────────────┤                                                               │
│ _id (ObjectId)   │                                                               │
│ chat ────────────┼──► Chat._id                                                   │
│ post ────────────┼──► Post._id                                                   │
│ giver ───────────┼──► User._id ──────────────────────────────────────────────────┘
│ receiver ────────┼──► User._id
│ status           │
│ meetingDetails   │
│   scheduledTime  │
│   location       │
│   method         │
│   notes          │
│ statusHistory[]  │
│   status         │
│   timestamp      │
│   updatedBy ─────┼──► User._id
│   note           │
│ rating           │
│   giverRating    │
│   receiverRating │
│ cancelledBy ─────┼──► User._id
│ cancelReason     │
│ createdAt        │
└──────────────────┘
```

## Collections Summary

| Collection | Description | Key Relationships |
|------------|-------------|-------------------|
| **User** | User accounts and profiles | Referenced by all other collections |
| **Post** | Shared items, knowledge, or support | Belongs to User (author) |
| **Comment** | Comments on posts | Belongs to Post and User |
| **Report** | Content moderation reports | References Post and Users |
| **Chat** | Conversation threads | References Users (participants) and Post |
| **Message** | Individual chat messages | Belongs to Chat, sent by User |
| **Exchange** | Item exchange coordination | Links Chat, Post, and Users |

## Relationship Types

### One-to-Many (1:N)
- User → Posts (one user can create many posts)
- User → Comments (one user can write many comments)
- User → Reports (one user can file many reports)
- Post → Comments (one post can have many comments)
- Post → Reports (one post can have many reports)
- Chat → Messages (one chat can have many messages)

### Many-to-Many (M:N)
- User ↔ Chat (users can participate in multiple chats, chats have multiple participants)
- User ↔ Post Reactions (users can react to multiple posts, posts can have multiple reactions)
- User ↔ Comment Likes (users can like multiple comments, comments can have multiple likes)
- User ↔ Message Read Receipts (users can read multiple messages, messages can be read by multiple users)

### One-to-One (1:1)
- Chat ↔ Exchange (each chat can have one active exchange)

## Field Descriptions

### User
| Field | Type | Description |
|-------|------|-------------|
| username | String | Unique username (3-30 chars) |
| email | String | Unique email address |
| password | String | Hashed password (bcrypt) |
| fullName | String | Display name |
| avatar | String | Profile picture URL |
| bio | String | User biography (max 500 chars) |
| gender | Enum | male, female, other, prefer-not-to-say |
| dateOfBirth | Date | User's birth date |
| rating | Number | Average rating (0-5) |
| ratingCount | Number | Number of ratings received |
| totalLikes | Number | Total likes received |
| isAdmin | Boolean | Admin privileges flag |
| isBlocked | Boolean | Account blocked status |

### Post
| Field | Type | Description |
|-------|------|-------------|
| title | String | Post title (max 200 chars) |
| description | String | Post content (max 10,000 chars) |
| category | Enum | items, knowledge, emotional-support, other |
| status | Enum | available, pending, donated, closed |
| image | String | Featured image URL |
| contentImages | Array | Inline image URLs |
| author | ObjectId | Reference to User |
| reactions | Array | User reactions with type |
| viewCount | Number | Total views |
| viewedBy | Array | Users who viewed |

### Comment
| Field | Type | Description |
|-------|------|-------------|
| post | ObjectId | Reference to Post |
| author | ObjectId | Reference to User |
| content | String | Comment text (max 1,000 chars) |
| likes | Array | Users who liked |

### Report
| Field | Type | Description |
|-------|------|-------------|
| post | ObjectId | Reference to reported Post |
| reporter | ObjectId | Reference to reporting User |
| reason | Enum | spam, inappropriate, scam, harassment, other |
| description | String | Additional details (max 500 chars) |
| status | Enum | pending, reviewed, resolved, dismissed |
| reviewedBy | ObjectId | Admin who reviewed |
| reviewNotes | String | Admin notes (max 500 chars) |

### Chat
| Field | Type | Description |
|-------|------|-------------|
| participants | Array | User references (2 participants) |
| lastMessage | ObjectId | Reference to most recent Message |
| post | ObjectId | Related Post (optional) |
| unreadCount | Map | Unread count per user |

### Message
| Field | Type | Description |
|-------|------|-------------|
| chat | ObjectId | Reference to Chat |
| sender | ObjectId | Reference to sending User |
| content | String | Message text (max 2,000 chars) |
| messageType | Enum | text, file, image |
| fileUrl | String | Uploaded file URL |
| fileName | String | Original file name |
| fileSize | Number | File size in bytes |
| readBy | Array | Read receipts with timestamps |
| reactions | Array | Message reactions |
| isDelivered | Boolean | Delivery status |
| deliveredAt | Date | Delivery timestamp |
| isDeleted | Boolean | Soft delete flag |
| deletedAt | Date | Deletion timestamp |
| deletedBy | ObjectId | User who deleted |

### Exchange
| Field | Type | Description |
|-------|------|-------------|
| chat | ObjectId | Reference to Chat |
| post | ObjectId | Reference to Post |
| giver | ObjectId | Item donor (User) |
| receiver | ObjectId | Item receiver (User) |
| status | Enum | requested, accepted, scheduled, in_progress, completed, cancelled, declined |
| meetingDetails | Object | Time, location, method, notes |
| statusHistory | Array | Status change log |
| rating | Object | Giver and receiver ratings |
| cancelledBy | ObjectId | User who cancelled |
| cancelReason | String | Cancellation reason |

## Indexes

### User
- `username`: Unique index
- `email`: Unique index

### Post
- `title, description`: Text index (search)
- `category, status, createdAt`: Compound index (filtering)

### Comment
- `post, createdAt`: Compound index (queries by post)

### Report
- `status, createdAt`: Compound index (admin queries)

### Chat
- `participants, updatedAt`: Compound index

### Message
- `chat, createdAt`: Compound index (message history)
- `isDelivered, readBy.user`: Compound index (delivery tracking)

### Exchange
- `chat`: Index
- `post`: Index
- `giver, status`: Compound index
- `receiver, status`: Compound index
- `status, createdAt`: Compound index
