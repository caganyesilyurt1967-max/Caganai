// public/js/modules/auth.js

const Auth = {
  user: {
    id: 'anon-user',
    displayName: 'Kullanıcı',
    email: 'aktif@oturum'
  },

  isAuthenticated: true,

  async init() {
    this.showChatUI();
  },

  showChatUI() {
    const loginScreen = document.getElementById('loginScreen');
    const loginPrompt = document.getElementById('loginPrompt');
    const chatArea = document.getElementById('chatArea');
    const inputArea = document.getElementById('inputArea');
    const welcomeScreen = document.getElementById('welcomeScreen');

    if (loginScreen) loginScreen.remove();
    if (loginPrompt) loginPrompt.remove();

    if (chatArea) chatArea.classList.remove('hidden');
    if (inputArea) inputArea.classList.remove('hidden');
    if (welcomeScreen) welcomeScreen.classList.remove('hidden');

    document.querySelectorAll(
      '.google-login-btn, #loginBtn, #loginBtnCenter, .login-required'
    ).forEach(el => el.remove());

    document.querySelectorAll('p, span, div').forEach(el => {
      const text = el.textContent?.trim();

      if (
        text === 'Google ile Giriş Yap' ||
        text === 'Mesaj göndermek için Google ile giriş yapın'
      ) {
        el.remove();
      }
    });
  }
};

window.Auth = Auth;

document.addEventListener('DOMContentLoaded', () => {
  Auth.init();
});
