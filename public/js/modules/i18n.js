// =============================================
// Çoklu Dil Desteği (Türkçe / İngilizce)
// =============================================

const I18n = {
    currentLang: localStorage.getItem('ai-platform-lang') || 'tr',
    
    translations: {
        tr: {
            app_name: 'Çağan AI',
            new_chat: 'Yeni Sohbet',
            chat_history: 'Sohbet Geçmişi',
            google_login: 'Google ile Giriş Yap',
            online: 'Çevrimiçi',
            offline: 'Çevrimdışı',
            mode_chat: 'Sohbet',
            mode_code: 'Kod Yazma',
            mode_research: 'Araştırma',
            welcome_title: "Çağan AI'a Hoş Geldiniz",
            welcome_desc: 'Yapay zeka asistanınızla sohbet etmeye başlayın. Kod yazın, araştırma yapın.',
            suggestion_1: 'Merhaba, nasılsın? 👋',
            suggestion_2: 'React ile todo app yaz',
            suggestion_3: 'Yapay zeka nedir?',
            message_placeholder: 'Mesajınızı yazın...',
            footer_note: 'Çağan AI © 2026 - Yapay zeka yanlış bilgi üretebilir.',
            thinking: 'Düşünüyor...',
            send: 'Gönder',
            cancel: 'İptal',
            delete: 'Sil',
            edit: 'Düzenle',
            copy: 'Kopyala',
            copied: 'Kopyalandı!',
            no_history: 'Henüz sohbet geçmişiniz yok.',
            error_message: 'Bir hata oluştu. Lütfen tekrar deneyin.',
            login_required: 'Bu özelliği kullanmak için giriş yapmalısınız.',
            logout_message: 'Başarıyla çıkış yapıldı.',
        },
        en: {
            app_name: 'Çağan AI',
            new_chat: 'New Chat',
            chat_history: 'Chat History',
            google_login: 'Sign in with Google',
            online: 'Online',
            offline: 'Offline',
            mode_chat: 'Chat',
            mode_code: 'Code',
            mode_research: 'Research',
            welcome_title: 'Welcome to Çağan AI',
            welcome_desc: 'Start chatting with your AI assistant. Write code and do research.',
            suggestion_1: 'Hello, how are you? 👋',
            suggestion_2: 'Write a todo app in React',
            suggestion_3: 'What is AI?',
            message_placeholder: 'Type your message...',
            footer_note: 'Çağan AI © 2026 - AI may produce inaccurate information.',
            thinking: 'Thinking...',
            send: 'Send',
            cancel: 'Cancel',
            delete: 'Delete',
            edit: 'Edit',
            copy: 'Copy',
            copied: 'Copied!',
            no_history: 'No chat history yet.',
            error_message: 'An error occurred. Please try again.',
            login_required: 'You must be logged in to use this feature.',
            logout_message: 'Successfully logged out.',
        }
    },

    // Dili değiştir
    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLang = lang;
            localStorage.setItem('ai-platform-lang', lang);
            this.updateUI();
            
            // Dil butonlarını güncelle
            document.querySelectorAll('.lang-btn').forEach(btn => {
                btn.classList.remove('bg-primary-600', 'text-white');
                btn.classList.add('bg-dark-700', 'text-dark-300', 'hover:bg-dark-600');
            });
            
            const activeBtn = document.getElementById(`lang${lang === 'tr' ? 'Tr' : 'En'}`);
            if (activeBtn) {
                activeBtn.classList.remove('bg-dark-700', 'text-dark-300', 'hover:bg-dark-600');
                activeBtn.classList.add('bg-primary-600', 'text-white');
            }

            // HTML lang attribute
            document.documentElement.lang = lang;
        }
    },

    // Belirtilen anahtarın çevirisini al
    t(key) {
        return this.translations[this.currentLang][key] || this.translations['tr'][key] || key;
    },

    // Tüm UI elementlerini güncelle
    updateUI() {
        document.querySelectorAll('[data-lang]').forEach(el => {
            const key = el.getAttribute('data-lang');
            el.textContent = this.t(key);
        });

        document.querySelectorAll('[data-lang-placeholder]').forEach(el => {
            const key = el.getAttribute('data-lang-placeholder');
            el.placeholder = this.t(key);
        });
    },

    // Mevcut dili getir
    getCurrentLang() {
        return this.currentLang;
    }
};

// DOM yüklendiğinde dil ayarını uygula
document.addEventListener('DOMContentLoaded', () => {
    I18n.setLanguage(I18n.currentLang);
});