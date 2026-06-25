// =============================================
// Google OAuth Kimlik Doğrulama Route'ları
// =============================================

const express = require('express');
const passport = require('passport');
const router = express.Router();

// Google OAuth giriş sayfasına yönlendir
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

// Google OAuth callback (Yarış durumu hatası tamamen çözüldü)
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/?login=failed' }),
  (req, res) => {
    // Oturum veritabanına/hafızaya tamamen yazılana kadar bekliyoruz
    req.session.save((err) => {
      if (err) {
        console.error('Oturum kaydedilirken hata oluştu:', err);
        return res.redirect('/?login=failed');
      }
      console.log('✅ Oturum başarıyla kaydedildi. Ana sayfaya güvenle yönlendiriliyor.');
      res.redirect('/');
    });
  }
);

// Kullanıcı oturumunu kapat ve çerezleri temizle
router.get('/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    
    req.session.destroy((destroyErr) => {
      if (destroyErr) {
        console.error('Oturum yok edilirken hata oluştu:', destroyErr);
      }
      res.clearCookie('connect.sid'); // Eski oturum çerezini tarayıcıdan kazı
      res.redirect('/');
    });
  });
});

// Kullanıcı bilgilerini ve durumunu getiren ortak fonksiyon
const handleAuthStatus = (req, res) => {
  try {
    if (req.isAuthenticated() && req.user) {
      res.json({
        authenticated: true,
        user: {
          id: req.user.id || req.user._id || '',
          displayName: req.user.displayName || '',
          email: req.user.email || '',
          photo: req.user.photo || ''
        }
      });
    } else {
      res.json({ authenticated: false });
    }
  } catch (error) {
    console.error('Kullanıcı bilgisi hatası:', error);
    res.json({ authenticated: false });
  }
};

// ÇAKIŞMA ÖNLEMİ: Frontend hem /status hem de /user çağırsa bile ikisi de çalışacak!
router.get('/status', handleAuthStatus);
router.get('/user', handleAuthStatus);

module.exports = router;