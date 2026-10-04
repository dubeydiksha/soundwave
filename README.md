# 🎵 SoundWave - Spotify-Inspired Music Streaming Web App

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/express-5.x-lightgrey.svg?style=flat-square&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%7C%20Mongoose-green.svg?style=flat-square&logo=mongodb)](https://www.mongodb.com/atlas)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue.svg?style=flat-square&logo=github)](https://github.com/USERNAME/soundwave)
[![Render](https://img.shields.io/badge/Deploy-Render-black.svg?style=flat-square&logo=render)](https://render.com)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=flat-square)](https://opensource.org/licenses/ISC)

SoundWave is a full-stack, responsive music streaming web application inspired by Spotify. Built with vanilla HTML/CSS/JavaScript on the frontend and Node.js, Express, and MongoDB Atlas on the backend. It features secure authentication, an original dark-mode design system with audio waveforms, automated song seeding with CSS gradient covers, and full CRUD functionality for personal **"Liked Songs"**.

---

## 📸 Screenshots & Highlights

- **Landing Page (`/`)**: Sticky navigation with dynamic auth detection, animated sound wave hero visualizer, horizontally scrollable "Trending Tracks" row, 4 responsive feature highlights, interactive pure-JS FAQ accordion, and dark-mode aesthetic.
- **Sign-Up Page (`/signup`)**: Real-time password strength meter, show/hide password toggles, server-side validation, inline duplicate email rejection, and automatic login redirect.
- **Log-In Page (`/login`)**: Secure authentication with "Remember me" 30-day session extension, show/hide password toggle, and friendly error handling.
- **Dashboard & Web Player (`/dashboard`)**: Protected route with personalized user greeting, real-time live search, genre filtering chips, full CRUD management of user-specific Liked Songs with confirmation dialogs, toast notifications, and an interactive bottom audio player bar.

---

## 🛠️ Tech Stack Table

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend UI** | HTML5, CSS3, Vanilla JS | Clean semantic markup, modern CSS custom properties, responsive grid & flexbox, zero build step. |
| **Backend Server** | Node.js, Express 5 | Fast, lightweight RESTful API serving static frontend assets and JSON endpoints. |
| **Database** | MongoDB Atlas & Mongoose | Hosted cloud NoSQL database with Mongoose schemas, compound unique indexes, and population. |
| **Authentication** | `bcryptjs` & `jsonwebtoken` | Cost-factor 10 password hashing with JWT stored in `httpOnly`, `SameSite=Lax` cookies. |
| **Environment** | `dotenv` | Centralized environment variable management. Secrets are never checked into version control. |
| **Deployment** | Render + MongoDB Atlas | Production-ready cloud deployment with automatic rebuilds on git push. |

---

## 📂 Project Structure

```text
soundwave/
├── .env.example              # Template for environment variables
├── .gitignore                # Excludes node_modules, .env, OS files
├── package.json              # Project metadata, dependencies & start scripts
├── README.md                 # Complete documentation & deployment guide
├── server.js                 # Express server, Mongoose models, auth middleware & API routes
└── public/                   # Static frontend assets served by Express
    ├── index.html            # Landing page (hero, trending tracks, FAQ, footer)
    ├── signup.html           # Sign-up page with password meter
    ├── login.html            # Log-in page with remember-me checkbox
    ├── dashboard.html        # Protected dashboard with Liked Songs CRUD & Web Player
    ├── style.css             # Unified dark theme stylesheet (#121212 & #1DB954 accent)
    └── js/
        ├── main.js           # Landing page logic, trending fetch, FAQ accordion
        ├── signup.js         # Sign-up validation, password strength, auto-login
        ├── login.js          # Authentication, session handling, error display
        └── dashboard.js      # Liked songs CRUD, live search, audio player simulation
```

---

## 🔐 How Passwords & Sessions Are Secured

Security is embedded into every layer of SoundWave:

1. **One-Way Password Hashing (`bcryptjs`)**:
   - Passwords are encrypted before touching the database using `bcryptjs` with a cost factor (salt rounds) of `10`.
   - Plaintext passwords are never stored, logged, or returned in any API response.
2. **Timing Attack Protection**:
   - The login endpoint returns a generic `"Invalid email or password"` message to prevent account enumeration.
3. **HTTP-Only, SameSite Cookies**:
   - The JWT authentication token is issued inside an `httpOnly` cookie with `SameSite=Lax`.
   - `httpOnly` ensures client-side scripts cannot access the token, preventing **XSS token theft**.
   - In production, cookies enforce the `secure: true` flag to mandate HTTPS transmission.
4. **XSS Prevention**:
   - All user-generated content (user names, email addresses, song titles, artists) is rendered via `textContent` rather than `innerHTML`.
5. **Payload Size Guard**:
   - Express body parsing is explicitly constrained (`limit: '10kb'`) to prevent denial-of-service via huge payloads.

---

## 🗄️ Database Schemas

### User
```javascript
{
  name: { type: String, required: true, trim: true, maxlength: 60 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }, // bcrypt hash only
  createdAt: { type: Date, default: Date.now }
}
```

### Song
```javascript
{
  title: { type: String, required: true, trim: true },
  artist: { type: String, required: true, trim: true },
  album: { type: String, trim: true },
  genre: { type: String, trim: true },
  duration: { type: String, trim: true },
  gradientCss: { type: String, default: 'linear-gradient(135deg, #1DB954, #121212)' },
  createdAt: { type: Date, default: Date.now }
}
```

### LikedSong
```javascript
{
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  song: { type: mongoose.Schema.Types.ObjectId, ref: 'Song', required: true },
  likedAt: { type: Date, default: Date.now }
}
// Compound unique index prevents duplicate likes per user:
likedSongSchema.index({ user: 1, song: 1 }, { unique: true });
```

---

## 📡 API Endpoints

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | No | Creates a new user account, sets 7-day auth cookie, returns user details. |
| `POST` | `/api/auth/login` | No | Verifies credentials, sets 7-day (or 30-day) auth cookie, returns user details. |
| `POST` | `/api/auth/logout` | No | Clears authentication cookie immediately. |
| `GET` | `/api/auth/me` | **Yes** | Returns authenticated user's ID, name, email, and joined date. |
| `GET` | `/api/songs` | No | Retrieves songs with optional query filters: `?q=searchterm` and `?genre=name`. |
| `GET` | `/api/liked` | **Yes** | Retrieves all liked songs belonging exclusively to the authenticated user. |
| `POST` | `/api/liked` | **Yes** | Adds a song to the user's Liked Songs library (`{ songId }`). |
| `DELETE`| `/api/liked/:id` | **Yes** | Removes a song from Liked Songs by either like ID or song ID. |

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory (refer to `.env.example`):

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `PORT` | No | `3000` | Port on which the Express web server listens. |
| `MONGO_URI` | **Yes** | `mongodb://localhost:27017/soundwave` | MongoDB Atlas connection string. |
| `JWT_SECRET` | **Yes** | None (change in production) | 32+ character cryptographic secret string used to sign JWTs. |
| `NODE_ENV` | No | `development` | Set to `production` when deploying to Render. |

---

## 🚀 Local Setup Instructions

### 1. Prerequisites
- **Node.js**: v20 or higher installed ([Download Node.js](https://nodejs.org/))
- **Git**: Installed on your system
- **MongoDB Atlas Account**: Free tier cluster ([MongoDB Atlas Signup](https://www.mongodb.com/cloud/atlas/register))

### 2. Clone or Extract Project
Open your terminal (PowerShell on Windows, Terminal on macOS/Linux):

**Windows (PowerShell)**:
```powershell
cd C:\Users\$env:USERNAME\Downloads
mkdir soundwave ; cd soundwave
```

**macOS / Linux**:
```bash
cd ~/Downloads/soundwave
```

### 3. Install Dependencies
```powershell
npm install
```

### 4. Configure Environment
Copy `.env.example` to `.env`:
```powershell
cp .env.example .env
```
Open `.env` and fill in your MongoDB Atlas connection string and a secure `JWT_SECRET`:
```env
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/soundwave?retryWrites=true&w=majority
JWT_SECRET=super_secret_soundwave_jwt_key_2026_change_me
NODE_ENV=development
```

### 5. Run the Server
```powershell
npm start
```
The server will start at:
👉 **`http://localhost:3000`**

On initial startup with a connected MongoDB database, SoundWave automatically seeds 16 fictional songs across various genres (Synthwave, Indie Pop, Electronic, Lo-Fi Chill, R&B, etc.).

---

## ☁️ Deployment Guide (Render + MongoDB Atlas)

### Step 1: Set Up MongoDB Atlas
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. Create a free **M0 Sandbox Cluster**.
3. Under **Database Access**, create a database user (e.g. `soundwave_admin`) with a secure password.
4. Under **Network Access**, add an IP access rule: `0.0.0.0/0` (Allow access from anywhere).
5. Click **Connect** → **Drivers** (Node.js) and copy the connection string:
   ```text
   mongodb+srv://soundwave_admin:<password>@cluster0.abcde.mongodb.net/soundwave?retryWrites=true&w=majority
   ```

### Step 2: Push Code to GitHub
```powershell
git init ; git add . ; git commit -m "Initial commit: SoundWave full-stack music streaming clone"
git branch -M main
git remote add origin https://github.com/USERNAME/soundwave.git
git push -u origin main
```
*(Replace `USERNAME` with your actual GitHub username)*

### Step 3: Deploy to Render
1. Visit [Render Dashboard](https://dashboard.render.com/) and click **New +** → **Web Service**.
2. Connect your `soundwave` GitHub repository.
3. Configure the service settings:
   - **Name**: `soundwave`
   - **Region**: Choose the closest region to you
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. In the **Environment Variables** section, add:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = *(Generate a random 32+ character string)*
   - `MONGO_URI` = *(Your MongoDB Atlas connection URI)*
5. Click **Create Web Service**.
6. Render will automatically build the app and deploy your live URL (e.g. `https://soundwave.onrender.com`).

---

## 📄 License

This project is licensed under the [ISC License](https://opensource.org/licenses/ISC). Built for educational and portfolio demonstration.
