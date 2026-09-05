const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Route'lar
const chatRoutes = require('./routes/chat');
const imageRoutes = require('./routes/image');

app.use('/api/chat', chatRoutes);
app.use('/api/image', imageRoutes);

// Her zaman giriş yapılmış kabul et
app.get('/api/auth/status', (req, res) => {
  res.json({
    authenticated: true,
    user: {
      id: 'anon-user',
      displayName: 'Kullanıcı',
      email: 'aktif@oturum'
    }
  });
});

// Statik dosyalar
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
});
