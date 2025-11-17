# ShareCare Quick Start Guide

This guide will help you get ShareCare up and running in minutes.

## Prerequisites

- Node.js v18+ installed
- MongoDB running (local or remote)
- npm or yarn package manager

## Quick Setup (5 minutes)

### 1. Clone the Repository
```bash
git clone https://github.com/RenRen-k995/ShareCare.git
cd ShareCare
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your settings
# Minimum required: update MONGODB_URI if needed
nano .env  # or use your preferred editor
```

**Important**: Update the `.env` file with:
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: A secure random string (change from default!)

```bash
# Start the backend server
npm run dev
```

Backend will run at `http://localhost:5000`

### 3. Frontend Setup (in a new terminal)

```bash
# Navigate to frontend (from project root)
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start the development server
npm run dev
```

Frontend will run at `http://localhost:5173`

## First Steps

1. **Open your browser** to `http://localhost:5173`

2. **Register a new account**
   - Click "Register"
   - Fill in username, email, and password
   - Click "Register"

3. **Create your first post**
   - Click "New Post"
   - Add title, description, category
   - Optionally upload an image
   - Click "Create Post"

4. **Explore features**
   - Browse posts on the home page
   - Filter by category or status
   - React to posts (heart icon)
   - Add comments
   - Report inappropriate content

## Creating an Admin User

To create an admin user, you need to manually update the MongoDB database:

```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/sharecare

# Update a user to be admin
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { isAdmin: true } }
)
```

Then login again, and you'll see the "Admin Panel" link in the navigation.

## Troubleshooting

### Backend won't start
- Check if MongoDB is running
- Verify `.env` file has correct MONGODB_URI
- Check if port 5000 is available

### Frontend won't start
- Check if all dependencies installed correctly
- Verify `.env` file has correct API URL
- Check if port 5173 is available

### Can't create posts with images
- Ensure `backend/uploads/` directory exists
- Check file size (max 5MB)
- Only image files are allowed

### "Too many requests" error
- This is rate limiting for security
- Wait 15 minutes and try again
- Or adjust limits in `backend/src/middleware/rateLimiter.js`

## Production Deployment

### Backend
```bash
cd backend
npm install --production
npm start
```

Set these environment variables:
- `NODE_ENV=production`
- `MONGODB_URI=<production-db-uri>`
- `JWT_SECRET=<secure-random-string>`
- `PORT=5000`

### Frontend
```bash
cd frontend
npm run build
```

Serve the `dist` folder with any static file server (nginx, Apache, etc.)

Set environment variable:
- `VITE_API_URL=<your-backend-url>/api`

## Next Steps

- Explore the Admin Panel (if you're an admin)
- Try the search and filter functionality
- Create posts in different categories
- Engage with the community through comments
- Report inappropriate content to test moderation

## Support

For issues or questions:
- Check the main README.md for detailed documentation
- Review API endpoints documentation
- Check troubleshooting section above

Happy sharing and caring! 💙
