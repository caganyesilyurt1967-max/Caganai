// =============================================
// Sidebar / Hamburger Menü Modülü
// =============================================

const Sidebar = {
    isOpen: false,

    init() {
        this.setupEventListeners();
    },

    setupEventListeners() {
        const openBtn = document.getElementById('openSidebar');
        const closeBtn = document.getElementById('closeSidebar');
        const overlay = document.getElementById('sidebarOverlay');
        const newChatBtn = document.getElementById('newChatBtn');

        if (openBtn) {
            openBtn.addEventListener('click', () => this.open());
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        if (overlay) {
            overlay.addEventListener('click', () => this.close());
        }

        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => {
                Chat.newSession();
                this.close();
            });
        }

        // Sohbet geçmişi yükle
        this.loadChatHistory();
    },

    open() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (sidebar && overlay) {
            sidebar.classList.add('open');
            sidebar.classList.remove('-translate-x-full');
            overlay.classList.remove('hidden');
            this.isOpen = true;
        }
    },

    close() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (sidebar && overlay) {
            sidebar.classList.remove('open');
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
            this.isOpen = false;
        }
    },

    // Sohbet geçmişini yükle
    async loadChatHistory() {
        try {
            const response = await fetch('/api/chat/sessions', {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.success && data.sessions) {
                this.renderChatHistory(data.sessions);
            }
        } catch (error) {
            console.error('Sohbet geçmişi yüklenemedi:', error);
        }
    },

    // Sohbet geçmişini render et
    renderChatHistory(sessions) {
        const list = document.getElementById('chatHistoryList');
        if (!list) return;

        if (sessions.length === 0) {
            list.innerHTML = `
                <div class="px-3 py-4 text-center">
                    <p class="text-xs text-dark-500" data-lang="no_history">${I18n.t('no_history')}</p>
                </div>
            `;
            return;
        }

        list.innerHTML = sessions.map(session => `
            <div class="chat-history-item flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${session.id === Chat.currentSessionId ? 'active' : ''}" data-session-id="${session.id}">
                <div class="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style="background: rgba(99,102,241,0.1);">
                    <i class="fas fa-comment text-[10px] text-primary-400"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-xs text-dark-200 truncate">${this.escapeHtml(session.title)}</p>
                    <p class="chat-time">${this.formatDate(session.updatedAt)}</p>
                </div>
                <button class="delete-session text-dark-500 hover:text-red-400 transition-colors text-xs" data-session-id="${session.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');

        // Sohbet öğelerine tıklama olayı
        list.querySelectorAll('.chat-history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.delete-session')) return;
                const sessionId = item.dataset.sessionId;
                Chat.loadSession(sessionId);
                this.close();
            });
        });

        // Silme butonları
        list.querySelectorAll('.delete-session').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const sessionId = btn.dataset.sessionId;
                if (confirm('Bu sohbeti silmek istediğinize emin misiniz?')) {
                    await Chat.deleteSession(sessionId);
                }
            });
        });
    },

    // Tarih formatla
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Az önce';
        if (diff < 3600000) return Math.floor(diff / 60000) + ' dk önce';
        if (diff < 86400000) return Math.floor(diff / 3600000) + ' sa önce';
        if (diff < 604800000) return Math.floor(diff / 86400000) + ' gün önce';
        
        return date.toLocaleDateString();
    },

    // HTML escape
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};