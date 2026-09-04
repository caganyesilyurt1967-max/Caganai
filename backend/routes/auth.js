// =============================================
// Oturum ve Kullanıcı Durumu Route'ları (Google OAuth Kaldırıldı)
// =============================================

const express = require('express');
const router = express.Router();

// ---------------------------------------------
// Kullanıcı Çıkış Yapma Route'u
// ---------------------------------------------
router.get('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Oturum yok edilirken hata oluştu:', err);
      }
      res.clearCookie('connect.sid'); // Oturum çerezini temizle
      res.redirect('/');
    });
  } else {
    res.redirect('/');
  }
});

// ---------------------------------------------
// Kullanıcı Durumu ve Profil Fonksiyonu
// ---------------------------------------------
const handleAuthStatus = (req, res) => {
  try {
    // Eğer oturum açıksa kullanıcı bilgilerini dön, değilse varsayılan anonim yapıyı dön
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      res.json({
        authenticated: true,
        user: {
          id: req.user.id || req.user._id || 'user',
          displayName: req.user.displayName || 'Kullanıcı',
          email: req.user.email || '',
          photo: req.user.photo || ''
        }
      });
    } else {
      res.json({
        authenticated: false,
        user: null
      });
    }
  } catch (error) {
    console.error('Kullanıcı bilgisi kontrol hatası:', error);
    res.json({ authenticated: false, user: null });
  }
};

// ---------------------------------------------
// Frontend API Endpoint'leri
// ---------------------------------------------
router.get('/status', handleAuthStatus);
router.get('/user', handleAuthStatus);

module.exports = router;
