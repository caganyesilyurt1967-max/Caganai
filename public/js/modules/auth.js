// =============================================
// Google OAuth Kimlik Doğrulama Modülü (Frontend)
// =============================================

const Auth = {
    user: null,
    isAuthenticated: false,

    // Auth durumunu kontrol et
    async checkStatus() {
        try {
            // Rota backend ile %100 uyumlu hale getirildi
            const response = await fetch('/auth/status', {
                method: 'GET',
                credentials: 'include' // Oturum çerezini güvenle taşır
            });
            const data = await response.json();
            
            if (data.authenticated && data.user) {
                this.user = data.user;
                this.isAuthenticated = true;
                this.showUserInfo(data.user);
            } else {
                this.isAuthenticated = false;
                this.user = null;
                this.showLoginButton();
            }
            return data;
        } catch (error) {
            console.error('Auth kontrol hatası:', error);
            this.isAuthenticated = false;
            this.user = null;
            this.showLoginButton();
            return { authenticated: false };
        }
    },

    // Kullanıcı bilgilerini UI üzerinde göster
    showUserInfo(user) {
        if (!user) return;
        const userInfo = document.getElementById('userInfo');
        const loginPrompt = document.getElementById('loginPrompt');
        
        if (userInfo && loginPrompt) {
            userInfo.classList.remove('hidden');
            loginPrompt.classList.add('hidden');
            
            const userNameEl = document.getElementById('userName');
            const userEmailEl = document.getElementById('userEmail');
            
            if (userNameEl) userNameEl.textContent = user.displayName;
            if (userEmailEl) userEmailEl.textContent = user.email;
            
            const avatar = document.getElementById('userAvatar');
            if (avatar) {
                if (user.photo) {
                    avatar.src = user.photo;
                } else {
                    avatar.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.displayName) + '&background=4f46e5&color=fff';
                }
            }
        }
        
        // Ana uygulamayı göster (app.js entegrasyonu)
        if (typeof App !== 'undefined' && typeof App.showMainApp === 'function') {
            App.showMainApp();
        }
    },

    // Giriş butonunu göster, kullanıcı panelini gizle
    showLoginButton() {
        const userInfo = document.getElementById('userInfo');
        const loginPrompt = document.getElementById('loginPrompt');
        
        if (userInfo && loginPrompt) {
            userInfo.classList.add('hidden');
            loginPrompt.classList.remove('hidden');
        }
        
        // Giriş ekranını göster (app.js entegrasyonu)
        if (typeof App !== 'undefined' && typeof App.showLoginScreen === 'function') {
            App.showLoginScreen();
        }
    },

    // Google ile giriş yapma sayfasına yönlendir
    login() {
        window.location.href = '/auth/google';
    },

    // Çıkış yap ve oturumu sonlandır
    async logout() {
        try {
            await fetch('/auth/logout', {
                method: 'GET',
                credentials: 'include'
            });
            this.user = null;
            this.isAuthenticated = false;
            this.showLoginButton();
            
            if (typeof App !== 'undefined' && typeof App.showToast === 'function') {
                App.showToast('Çıkış yapıldı', 'success');
            } else {
                window.location.reload(); // Fallback: tost mesajı yoksa sayfayı yenile
            }
        } catch (error) {
            console.error('Çıkış hatası:', error);
        }
    },

    // Mevcut kullanıcıyı dön
    getUser() {
        return this.user;
    },

    // Giriş yapılmış mı durumunu dön
    isLoggedIn() {
        return this.isAuthenticated;
    }
};