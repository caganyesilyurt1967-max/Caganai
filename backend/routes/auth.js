// =============================================
// Auth Modülü (Google Giriş Zorunluluğu Kaldırıldı)
// =============================================

const Auth = {
  user: {
    id: 'anon-user',
    displayName: 'Kullanıcı',
    email: 'aktif@oturum'
  },
  isAuthenticated: true,

  async init() {
    // Sayfa açılır açılmaz sohbet alanını görünür yap, giriş engellerini kaldır
    this.showChatUI();
  },

  showChatUI() {
    const loginScreen = document.getElementById('loginScreen');
    const chatArea = document.getElementById('chatArea');
    const inputArea = document.getElementById('inputArea');
    const welcomeScreen = document.getElementById('welcomeScreen');
    const loginPrompt = document.getElementById('loginPrompt');
    const userInfo = document.getElementById('userInfo');

    // Giriş ekranlarını gizle
    if (loginScreen) loginScreen.classList.add('hidden');
    if (loginPrompt) loginPrompt.classList.add('hidden');

    // Sohbet ve mesaj alanlarını aç
    if (chatArea) chatArea.classList.remove('hidden');
    if (inputArea) inputArea.classList.remove('hidden');
    if (welcomeScreen) welcomeScreen.classList.remove('hidden');
    if (userInfo) userInfo.classList.remove('hidden');

    // Sitede "Mesaj göndermek için Google ile giriş yapın" yazan yerleri ve Google butonlarını gizle
    document.querySelectorAll('.google-login-btn, #loginBtn, #loginBtnCenter').forEach(el => {
      if (el) el.style.display = 'none';
    });

    // Varsa "Mesaj göndermek için..." uyarı yazılarını kaldır
    const bodyText = document.body.innerHTML;
    document.querySelectorAll('p, div, span').forEach(el => {
      if (el.children.length === 0 && el.textContent.includes('Mesaj göndermek için Google ile giriş yapın')) {
        el.remove();
      }
    });
  }
};

// Sayfa yüklendiğinde auth kontrolünü çalıştır
document.addEventListener('DOMContentLoaded', () => {
  Auth.init();
});
