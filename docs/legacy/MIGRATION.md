> **ARCHIVED — HISTORICALLY INACCURATE.**
> This document describes a MongoDB/Mongoose (and in places Google Sheets) architecture
> that this project does not use. EDUBUILD runs on Supabase PostgreSQL with Sequelize.
> It is kept only to explain how the project evolved.
>
> **See [../../README.md](../../README.md) for current setup instructions.**

---

# 🔄 EDUBUILD Migration Guide: Google Sheets → Backend Architecture

## 📋 What Changed?

Your EDUBUILD project has been **upgraded from a Google Sheets-based frontend to a proper full-stack application with Express.js backend and MongoDB database**.

---

## ❌ Removed

### Files Deleted:
- ❌ `scripts/googleSheetsSync.js` - Google Sheets sync script
- ❌ `scripts/syncSheetsToLocal.js` - Local sync script
- ❌ `vm-ddk-business-9ee25e005e0d.json` - Google Service Account Key (sensitive!)

### Dependencies Removed from `package.json`:
- ❌ `googleapis` - Google Sheets API
- ❌ `node-fetch` - Not needed for frontend

### What the frontend no longer does:
- ❌ Call Google Apps Script URLs
- ❌ Sync data from Google Sheets
- ❌ Store service account keys in repo

---

## ✅ Added

### New Backend Structure (`/backend`)

```
backend/
├── config/db.js                    # MongoDB connection
├── models/
│   ├── User.js                     # Users (teachers, admins)
│   ├── Project.js                  # Projects
│   └── Feedback.js                 # Project feedback
├── controllers/
│   ├── authController.js           # Login/signup logic
│   ├── projectController.js        # Project CRUD
│   └── feedbackController.js       # Feedback logic
├── routes/
│   ├── authRoutes.js               # /api/auth endpoints
│   ├── projectRoutes.js            # /api/projects endpoints
│   └── feedbackRoutes.js           # /api/feedback endpoints
├── middleware/
│   ├── auth.js                     # JWT verification
│   └── adminOnly.js                # Admin check
├── server.js                       # Express app
├── package.json                    # Backend dependencies
└── README.md                       # Backend documentation
```

### New Frontend Service (`src/services/googleSheets.js` → Backend API)

**Old way:**
```javascript
// Sync with Google Sheets via Apps Script
fetch(GOOGLE_SHEET_WEBAPP_URL)
```

**New way:**
```javascript
// Fetch from Express.js backend
fetch('http://localhost:5000/api/projects')
```

### Environment Variables

**Frontend (.env):**
```
VITE_API_URL=http://localhost:5000/api
```

**Backend (.env):**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/edubuild
JWT_SECRET=your_secret_here
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

---

## 🚀 How to Run Now

### Terminal 1: Start Backend
```bash
cd backend
npm install
npm run dev
# ✅ Backend running on http://localhost:5000
```

### Terminal 2: Start Frontend
```bash
npm install
npm run dev
# ✅ Frontend running on http://localhost:5173
```

---

## 🔄 API Changes

### Old Flow (Google Sheets):
1. Frontend → Google Apps Script → Google Sheets → Return JSON
2. Slow & dependent on external service
3. No proper database

### New Flow (Backend):
1. Frontend → Express Backend → MongoDB → Return JSON
2. Fast & scalable
3. Full database control

---

## 📊 Database Setup

### Local MongoDB

```bash
# Install MongoDB Community Edition
# https://docs.mongodb.com/manual/installation/

# Windows: Use MongoDB installer or:
# Start MongoDB service: net start MongoDB

# Then backend will connect to:
mongodb://localhost:27017/edubuild
```

### Cloud MongoDB (MongoDB Atlas)

Alternatively, use free cloud database:

1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create free cluster
3. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/edubuild`
4. Update `backend/.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/edubuild
   ```

---

## 🔐 Security Improvements

### Old Approach (❌ Risky):
- Service account key in repo (exposed!)
- Direct Google Sheets access
- Limited authentication

### New Approach (✅ Secure):
- JWT tokens for authentication
- Passwords hashed with bcryptjs
- No sensitive keys in repo
- Backend validates all requests
- CORS configured
- Role-based access (teacher/admin)

---

## 📝 Code Migration Examples

### Fetching Projects

**Before (Google Sheets):**
```javascript
import { fetchProjects } from '../services/googleSheets';

const projects = await fetchProjects(); // Only returned what was in Sheets
```

**After (Backend API):**
```javascript
import { fetchProjects } from '../services/googleSheets'; // Now calls backend

// With filters!
const projects = await fetchProjects({ 
  budget: 150, 
  classLevel: '9-10', 
  subject: 'Physics' 
});
```

### Creating a Project

**Before (Google Sheets):**
- Had to manually add to Google Sheets
- No proper backend validation

**After (Backend API):**
```javascript
const response = await fetch('http://localhost:5000/api/projects', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'Hydraulic Lift',
    description: '...',
    budget: 50,
    classLevel: '9-10',
    subject: 'Physics',
    materials: [...],
    steps: [...]
  })
});
```

---

## 🐛 Troubleshooting

### "Cannot reach backend at http://localhost:5000"

- ✅ Is backend running? Check Terminal 1
- ✅ Is VITE_API_URL correct in frontend `.env`?
- ✅ Check if port 5000 is already in use

### "MongoDB connection failed"

- ✅ Is MongoDB running locally?
- ✅ Is MongoDB URI correct in `backend/.env`?
- ✅ Try MongoDB Atlas (cloud) instead

### "Token invalid/expired"

- ✅ Login again to get new token
- ✅ Token expires after 7 days
- ✅ Check JWT_SECRET is same in backend

---

## ✨ Benefits of New Architecture

| Feature | Google Sheets | Backend |
|---------|---------------|---------|
| **Database** | Spreadsheet | MongoDB |
| **Real-time** | Manual refresh | Automatic |
| **Scalability** | Limited | Unlimited |
| **Security** | Key exposed | Secure JWT |
| **Speed** | Slow | Fast |
| **Search/Filter** | Limited | Advanced |
| **Ratings** | Manual | Automatic |
| **Offline** | ❌ | ✅ Planned |

---

## 🎓 Next Steps

1. ✅ Install MongoDB (local or Atlas)
2. ✅ Create `.env` files in both frontend & backend
3. ✅ Run `npm install` in backend
4. ✅ Start backend with `npm run dev`
5. ✅ Start frontend with `npm run dev`
6. ✅ Test authentication at `http://localhost:5173`

---

## 📚 Resources

- [Backend Documentation](./backend/README.md)
- [Express.js Docs](https://expressjs.com/)
- [MongoDB Docs](https://docs.mongodb.com/)
- [JWT Tutorial](https://jwt.io/introduction)

---

**Your project is now production-ready! 🚀**

Questions? Check backend/README.md for detailed API docs.
