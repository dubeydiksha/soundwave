require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/soundwave';
const JWT_SECRET = process.env.JWT_SECRET || 'soundwave-super-secret-jwt-key-development-2026';

// Middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------
// DATABASE SCHEMAS
// ---------------------------------------------------------

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [60, 'Name cannot exceed 60 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Song Schema
const songSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  artist: {
    type: String,
    required: [true, 'Artist is required'],
    trim: true
  },
  album: {
    type: String,
    trim: true
  },
  genre: {
    type: String,
    trim: true
  },
  duration: {
    type: String,
    trim: true
  },
  gradientCss: {
    type: String,
    default: 'linear-gradient(135deg, #1DB954, #121212)'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// LikedSong Schema
const likedSongSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  song: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song',
    required: true
  },
  likedAt: {
    type: Date,
    default: Date.now
  }
});

likedSongSchema.index({ user: 1, song: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);
const Song = mongoose.model('Song', songSchema);
const LikedSong = mongoose.model('LikedSong', likedSongSchema);

// ---------------------------------------------------------
// SEED DATA (16 Fictional Songs)
// ---------------------------------------------------------
const SEED_SONGS = [
  {
    title: 'Neon Horizon',
    artist: 'The Midnight Drive',
    album: 'Retrograde 84',
    genre: 'Synthwave',
    duration: '3:42',
    gradientCss: 'linear-gradient(135deg, #FF007F, #7928CA)'
  },
  {
    title: 'Midnight Mirage',
    artist: 'Luna & The Waves',
    album: 'Starlight Echoes',
    genre: 'Indie Pop',
    duration: '4:15',
    gradientCss: 'linear-gradient(135deg, #1DB954, #191414)'
  },
  {
    title: 'Velvet Eclipse',
    artist: 'Kaelen Drake',
    album: 'Nocturne Odyssey',
    genre: 'R&B',
    duration: '3:08',
    gradientCss: 'linear-gradient(135deg, #6B11FF, #200052)'
  },
  {
    title: 'Quantum Pulse',
    artist: 'Hyperion 9',
    album: 'Cybernetic Dreams',
    genre: 'Electronic',
    duration: '5:20',
    gradientCss: 'linear-gradient(135deg, #00F2FE, #4FACFE)'
  },
  {
    title: 'Coffee Shop Reverie',
    artist: 'Sola & Beats',
    album: 'Rainy Afternoon',
    genre: 'Lo-Fi Chill',
    duration: '2:45',
    gradientCss: 'linear-gradient(135deg, #F3904F, #3B4371)'
  },
  {
    title: 'Solar Flares',
    artist: 'Phoenix Rising',
    album: 'Ignition Protocol',
    genre: 'Alt Rock',
    duration: '3:58',
    gradientCss: 'linear-gradient(135deg, #F857A6, #FF5858)'
  },
  {
    title: 'Deep Space Echo',
    artist: 'Andromeda Collective',
    album: 'Cosmic Horizon',
    genre: 'Ambient',
    duration: '4:32',
    gradientCss: 'linear-gradient(135deg, #0F2027, #203A43, #2C5364)'
  },
  {
    title: 'Golden Hour Groove',
    artist: 'Maya Lin',
    album: 'Daylight Melodies',
    genre: 'Neo-Soul',
    duration: '3:24',
    gradientCss: 'linear-gradient(135deg, #F7971E, #FFD200)'
  },
  {
    title: 'Subway Serenade',
    artist: 'Brooklyn Echoes',
    album: 'Concrete Jungle EP',
    genre: 'Hip-Hop',
    duration: '3:12',
    gradientCss: 'linear-gradient(135deg, #11998E, #38EF7D)'
  },
  {
    title: 'Prism Velocity',
    artist: 'Chroma Shift',
    album: 'Spectrum Breakdown',
    genre: 'Electro Funk',
    duration: '3:50',
    gradientCss: 'linear-gradient(135deg, #8A2387, #E94057, #F27121)'
  },
  {
    title: 'Raindrop Sonata',
    artist: 'Cedric Thorne',
    album: 'Quiet Reflections',
    genre: 'Classical Crossover',
    duration: '4:05',
    gradientCss: 'linear-gradient(135deg, #2BC0E4, #EAECC6)'
  },
  {
    title: 'Electric Twilight',
    artist: 'Nova Cascade',
    album: 'After Hours Club',
    genre: 'Deep House',
    duration: '4:48',
    gradientCss: 'linear-gradient(135deg, #654EA3, #EAAFC8)'
  },
  {
    title: 'Echoes in the Fog',
    artist: 'Winter & Wood',
    album: 'Mountain Whispers',
    genre: 'Indie Folk',
    duration: '3:35',
    gradientCss: 'linear-gradient(135deg, #3E5151, #DECBA4)'
  },
  {
    title: 'Tokyo Drift Lights',
    artist: 'Kenji Sato',
    album: 'Shibuya After Midnight',
    genre: 'Future Bass',
    duration: '3:29',
    gradientCss: 'linear-gradient(135deg, #FC466B, #3F5EFB)'
  },
  {
    title: 'Velvet Sunset',
    artist: 'Riviera Soul',
    album: 'Azure Coast',
    genre: 'Chillout',
    duration: '3:54',
    gradientCss: 'linear-gradient(135deg, #EE0979, #FF6A00)'
  },
  {
    title: 'Gravity Wave',
    artist: 'Orbital Station',
    album: 'Event Horizon',
    genre: 'Techno',
    duration: '5:10',
    gradientCss: 'linear-gradient(135deg, #00c6ff, #0072ff)'
  }
];

async function seedSongsIfEmpty() {
  try {
    const count = await Song.countDocuments();
    if (count === 0) {
      console.log('Seeding initial fictional songs into database...');
      await Song.insertMany(SEED_SONGS);
      console.log(`Successfully seeded ${SEED_SONGS.length} songs into database.`);
    } else {
      console.log(`Database already contains ${count} songs.`);
    }
  } catch (err) {
    console.error('Error seeding songs:', err.message);
  }
}

// ---------------------------------------------------------
// AUTHENTICATION MIDDLEWARE
// ---------------------------------------------------------
const authenticateToken = (req, res, next) => {
  let token = req.cookies.token;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userId, email, name }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
};

// Check DB Connection State Middleware for API
const requireDatabase = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Database connection is currently unavailable. Please verify MONGO_URI in your environment.'
    });
  }
  next();
};

// ---------------------------------------------------------
// API ROUTES
// ---------------------------------------------------------

// --- AUTH ROUTES ---

// POST /api/auth/signup
app.post('/api/auth/signup', requireDatabase, async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 60) {
      return res.status(400).json({ error: 'Full name must be between 2 and 60 characters.' });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    // Validate password
    // Minimum 8 characters, at least 1 letter and 1 number
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;
    if (!password || !passwordRegex.test(password)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long and contain at least one letter and one number.'
      });
    }

    // Validate confirm password
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check for duplicate email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Hash password with bcryptjs (cost factor 10)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword
    });

    // Auto-login: generate JWT token (7-day default)
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie: httpOnly, SameSite=Lax, 7 days
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(201).json({
      message: 'Account created successfully.',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Server error during sign up. Please try again.' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', requireDatabase, async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    // Protect against timing attacks / user enumeration with generic error
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Expiry: 30 days if rememberMe, else 7 days
    const isRemember = Boolean(rememberMe);
    const expiresIn = isRemember ? '30d' : '7d';
    const maxAge = (isRemember ? 30 : 7) * 24 * 60 * 60 * 1000;

    const token = jwt.sign(
      { userId: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn }
    );

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge
    });

    return res.status(200).json({
      message: 'Logged in successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during log in. Please try again.' });
  }
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
  return res.status(200).json({ message: 'Logged out successfully.' });
});

// GET /api/auth/me
app.get('/api/auth/me', requireDatabase, authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }
    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Auth check error:', err);
    return res.status(500).json({ error: 'Server error checking authentication status.' });
  }
});

// --- SONGS ROUTES ---

// GET /api/songs (public; supports ?q= and ?genre=)
app.get('/api/songs', async (req, res) => {
  try {
    const { q, genre } = req.query;

    if (mongoose.connection.readyState === 1) {
      const filter = {};
      if (genre && genre !== 'All' && genre !== 'all') {
        filter.genre = new RegExp(`^${genre.trim()}$`, 'i');
      }

      if (q && q.trim()) {
        const searchRegex = new RegExp(q.trim(), 'i');
        filter.$or = [
          { title: searchRegex },
          { artist: searchRegex },
          { album: searchRegex },
          { genre: searchRegex }
        ];
      }

      const songs = await Song.find(filter).sort({ title: 1 });
      return res.status(200).json({ songs });
    }

    // Graceful in-memory fallback if MongoDB connection is pending / not yet connected
    let songs = SEED_SONGS.map((s, idx) => ({ ...s, _id: `seed_${idx + 1}` }));
    if (genre && genre !== 'All' && genre !== 'all') {
      songs = songs.filter(s => s.genre.toLowerCase() === genre.trim().toLowerCase());
    }
    if (q && q.trim()) {
      const term = q.trim().toLowerCase();
      songs = songs.filter(s =>
        s.title.toLowerCase().includes(term) ||
        s.artist.toLowerCase().includes(term) ||
        (s.album && s.album.toLowerCase().includes(term)) ||
        (s.genre && s.genre.toLowerCase().includes(term))
      );
    }
    return res.status(200).json({ songs });
  } catch (err) {
    console.error('Error fetching songs:', err);
    return res.status(500).json({ error: 'Failed to fetch songs.' });
  }
});

// --- LIKED SONGS (CRUD) ---

// GET /api/liked (auth-protected: Read all user's liked songs)
app.get('/api/liked', requireDatabase, authenticateToken, async (req, res) => {
  try {
    // Each user sees ONLY their own liked songs (enforce req.user.userId)
    const list = await LikedSong.find({ user: req.user.userId })
      .populate('song')
      .sort({ likedAt: -1 });

    const likedSongs = list.filter(item => item.song != null);
    return res.status(200).json({ likedSongs });
  } catch (err) {
    console.error('Error fetching liked songs:', err);
    return res.status(500).json({ error: 'Failed to fetch liked songs.' });
  }
});

// POST /api/liked (auth-protected: Create a liked song)
app.post('/api/liked', requireDatabase, authenticateToken, async (req, res) => {
  try {
    const { songId } = req.body;

    if (!songId || !mongoose.Types.ObjectId.isValid(songId)) {
      return res.status(400).json({ error: 'A valid songId is required.' });
    }

    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({ error: 'Song not found.' });
    }

    // Check if already liked
    const existing = await LikedSong.findOne({
      user: req.user.userId,
      song: songId
    });

    if (existing) {
      return res.status(409).json({ error: 'Song is already in your Liked Songs.' });
    }

    const liked = await LikedSong.create({
      user: req.user.userId,
      song: songId
    });

    await liked.populate('song');

    return res.status(201).json({
      message: 'Song added to Liked Songs.',
      likedSong: liked
    });
  } catch (err) {
    // Handle duplicate key error in race conditions
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Song is already in your Liked Songs.' });
    }
    console.error('Error liking song:', err);
    return res.status(500).json({ error: 'Failed to like song.' });
  }
});

// DELETE /api/liked/:id (auth-protected: Delete a liked song by either likedSong._id OR song._id)
app.delete('/api/liked/:id', requireDatabase, authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ID provided.' });
    }

    // Find and delete ensuring it belongs to current authenticated user
    const deleted = await LikedSong.findOneAndDelete({
      user: req.user.userId,
      $or: [{ _id: id }, { song: id }]
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Liked song not found in your library.' });
    }

    return res.status(200).json({
      message: 'Song removed from Liked Songs.',
      id: deleted._id,
      songId: deleted.song
    });
  } catch (err) {
    console.error('Error removing liked song:', err);
    return res.status(500).json({ error: 'Failed to remove song.' });
  }
});

// ---------------------------------------------------------
// HTML PAGE ROUTES
// ---------------------------------------------------------
const PUBLIC_DIR = path.resolve(__dirname, 'public');

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: PUBLIC_DIR });
});

app.get('/signup', (req, res) => {
  res.sendFile('signup.html', { root: PUBLIC_DIR });
});

app.get('/login', (req, res) => {
  res.sendFile('login.html', { root: PUBLIC_DIR });
});

app.get('/dashboard', (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect('/login');
  }
  try {
    jwt.verify(token, JWT_SECRET);
    res.sendFile('dashboard.html', { root: PUBLIC_DIR });
  } catch (err) {
    res.clearCookie('token');
    return res.redirect('/login');
  }
});

// Catch-all 404 for undefined routes
app.use((req, res) => {
  if (req.accepts('html')) {
    return res.redirect('/');
  }
  res.status(404).json({ error: 'Route not found.' });
});

// ---------------------------------------------------------
// DATABASE CONNECTION & SERVER INITIALIZATION
// ---------------------------------------------------------
const server = app.listen(PORT, () => {
  console.log(`SoundWave server listening on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser.`);
});

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 5000
}).then(async () => {
  console.log('Connected to MongoDB successfully.');
  await seedSongsIfEmpty();
}).catch((err) => {
  console.warn('⚠️ Note on MongoDB connection:');
  console.warn(`   ${err.message}`);
  console.warn('   Ensure MONGO_URI is configured in your .env or Render dashboard.');
});

module.exports = { app, server };
