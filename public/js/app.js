// =============================================
// Çağan AI - Ana Uygulama Başlatıcı
// caganyesilyurt.com
// =============================================

const App = {
    // Uygulama başlangıcı
    async init() {
        console.log('🚀 Çağan AI başlatılıyor...');
        
        // Auth durumunu kontrol et
        await Auth.checkStatus();
        
        if (Auth.isAuthenticated) {
            this.showMainApp();
        } else {
            this.showLoginScreen();
        }
        
        // Tüm modülleri başlat
        I18n.setLanguage(I18n.currentLang);
        Chat.init();
        Sidebar.init();
        
        // Event listeners
        this.setupGlobalListeners();
        
        console.log('✅ Çağan AI başlatıldı!');
    },

    // Ana uygulamayı göster
    showMainApp() {
        const loginScreen = document.getElementById('loginScreen');
        const chatArea = document.getElementById('chatArea');
        const inputArea = document.getElementById('inputArea');
        const focusModes = document.getElementById('focusModes');
        
        if (loginScreen) loginScreen.classList.add('hidden');
        if (chatArea) chatArea.classList.remove('hidden');
        if (inputArea) inputArea.classList.remove('hidden');
        if (focusModes) focusModes.closest('.bg-dark-900\\/50')?.classList.remove('hidden');
    },

    // Giriş ekranını göster
    showLoginScreen() {
        const loginScreen = document.getElementById('loginScreen');
        const chatArea = document.getElementById('chatArea');
        const inputArea = document.getElementById('inputArea');
        const focusModesContainer = document.querySelector('.bg-dark-900\\/50');
        
        if (loginScreen) loginScreen.classList.remove('hidden');
        if (chatArea) chatArea.classList.add('hidden');
        if (inputArea) inputArea.classList.add('hidden');
        if (focusModesContainer) focusModesContainer.classList.add('hidden');
    },

    // Global event listeners
    setupGlobalListeners() {
        // Google ile giriş yap (sidebar)
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => Auth.login());
        }

        // Google ile giriş yap (merkez ekran)
        const loginBtnCenter = document.getElementById('loginBtnCenter');
        if (loginBtnCenter) {
            loginBtnCenter.addEventListener('click', () => Auth.login());
        }

        // Çıkış yap
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => Auth.logout());
        }

        // Dil değiştirme
        const langTr = document.getElementById('langTr');
        const langEn = document.getElementById('langEn');

        if (langTr) {
            langTr.addEventListener('click', () => {
                I18n.setLanguage('tr');
                Chat.setMode(Chat.currentMode);
            });
        }

        if (langEn) {
            langEn.addEventListener('click', () => {
                I18n.setLanguage('en');
                Chat.setMode(Chat.currentMode);
            });
        }

    },

    // Toast bildirimi göster
    showToast(message, type = 'info', duration = 3000) {
        document.querySelectorAll('.toast').forEach(t => t.remove());

        const toast = document.createElement('div');
        toast.className = `toast fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-xl text-sm font-medium flex items-center gap-2 ${
            type === 'error' ? 'bg-red-600 text-white' :
            type === 'success' ? 'bg-green-600 text-white' :
            'bg-dark-800 text-dark-200 border border-dark-600'
        }`;

        const icons = {
            error: '<i class="fas fa-exclamation-circle"></i>',
            success: '<i class="fas fa-check-circle"></i>',
            info: '<i class="fas fa-info-circle"></i>'
        };

        toast.innerHTML = `${icons[type] || icons.info} ${message}`;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100px)';
            toast.style.transition = 'all 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
};

// DOM yüklendiğinde uygulamayı başlat
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});