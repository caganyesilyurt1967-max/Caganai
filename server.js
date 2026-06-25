// =============================================
// AI PLATFORM - Ana Sunucu Dosyası
// =============================================

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session & Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'gizli_anahtar',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, httpOnly: true, sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
  const user = {
    id: profile.id,
    displayName: profile.displayName,
    email: profile.emails?.[0]?.value || '',
    photo: profile.photos?.[0]?.value || ''
  };
  return done(null, user);
}));
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Route modülleri
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
app.use('/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Auth durumu
app.get('/api/auth/status', (req, res) => {
  res.json({ authenticated: !!req.user, user: req.user || null });
});

// Statik dosyalar (cache kapalı)
app.use(express.static(path.join(__dirname, '..', 'public'), {
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
}));

app.get('*', (req, res) => {
  if (req.path === '/' || req.path.startsWith('/static') || !req.path.includes('.')) {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  } else {
    res.status(404).json({ error: "Dosya bulunamadı." });
  }
});

app.listen(PORT, () => {
  console.log(`[OK] AI Platform baslatildi: http://localhost:${PORT}`);
  console.log(`[Auth] Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? 'Ayarlı' : 'Ayarlanmamış'}`);
});