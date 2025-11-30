# ShareCare Frontend - Quick Start Guide

## New Design Implementation

The ShareCare frontend has been completely redesigned with a modern aesthetic featuring:

- **Curved Frame Layout**: Unified white sidebar + header with rounded content area
- **Modern UI Components**: Clean, rounded elements with gradient accents
- **Enhanced User Experience**: Intuitive navigation and prominent call-to-actions

## Running the Application

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Backend Setup

```bash
cd backend
npm install
npm start
```

## Key Files to Review

### Layout Components (`frontend/src/components/layout/`)

1. **MainLayout.jsx** - Main container with curved frame
2. **Sidebar.jsx** - Navigation with ShareCare branding
3. **Header.jsx** - Top bar with user actions
4. **RightSidebar.jsx** - Community stats and contributors

### Updated Pages (`frontend/src/pages/`)

- **Home.jsx** - Feed with CreatePostWidget
- **Chat.jsx** - Messaging interface
- **PostDetail.jsx** - Individual post view
- **CreatePost.jsx** - Post creation form

### Components (`frontend/src/components/`)

- **CreatePostWidget.jsx** - Quick post creation widget
- **PostCard.jsx** - Enhanced post cards with categories and actions

## Design Features

### Color Scheme

- **Primary**: Emerald/Teal gradient (`from-emerald-400 to-teal-500`)
- **Secondary**: Blue gradient for Knowledge category
- **Background**: White frame with Slate-50 content area

### Category System

- **Items** (Emerald accent) - Physical item donations
- **Knowledge** (Blue accent) - Information sharing
- **Emotional Support** (Purple accent) - Community support
- **Messages** - Real-time chat feature

### Key Interactions

1. **Create Post**: Prominent widget at top of feed
2. **Contact to Receive**: Button on item posts to start chat
3. **Navigation**: Sidebar with category-based routing
4. **Community Stats**: Live metrics in right sidebar

## Authentication Routes

All main pages require authentication except:

- `/login` - Login page
- `/register` - Registration page

Protected pages automatically redirect to `/login` if not authenticated.

## Testing the New Design

1. **Start both servers** (frontend + backend)
2. **Create an account** or log in
3. **Test navigation**: Click through sidebar links
4. **Create a post**: Use the widget or New Post button (+ icon)
5. **Test categories**: Navigate to Items, Knowledge, or Support
6. **Try messaging**: Click "Contact to Receive" on an item post
7. **View details**: Click on a post card to see full details

## Mobile Responsiveness

The layout adapts for mobile:

- Sidebar collapses to hamburger menu (to be implemented)
- Right sidebar hides on mobile
- Post cards stack vertically
- Chat interface switches between list and window views

## Next Development Steps

1. **Add filtering**: Search and filter options for posts
2. **Notifications**: Implement real notification system
3. **User profiles**: Full profile pages with edit capabilities
4. **Image optimization**: Add lazy loading and compression
5. **Infinite scroll**: Load more posts as user scrolls
6. **Admin panel**: Update to new layout design
7. **Mobile menu**: Implement responsive sidebar toggle

## Troubleshooting

### Port conflicts

- Frontend: http://localhost:5173 (Vite default)
- Backend: http://localhost:5000

### Environment variables

Check `frontend/.env` for:

```
VITE_API_URL=http://localhost:5000
```

### Database connection

Ensure MongoDB is running and connection string is correct in `backend/src/config/database.js`

## Documentation

- **Design Implementation**: See `DESIGN_IMPLEMENTATION.md` for detailed breakdown
- **API Documentation**: See `backend/README.md` (if exists)
- **Original README**: See `README.md` for project overview

---

**Ready to launch!** The new ShareCare design is fully implemented and ready for user testing.
