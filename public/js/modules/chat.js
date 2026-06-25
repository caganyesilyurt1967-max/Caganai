// =============================================
// Sohbet Modülü - Sohbet / Kod / Araştırma
// =============================================

const Chat = {
    currentSessionId: null,
    messages: [],
    currentMode: 'sohbet',
    isLoading: false,

    init() {
        this.setupEventListeners();
        this.loadInitialSession();
    },

    setupEventListeners() {
        const sendBtn = document.getElementById('sendBtn');
        const messageInput = document.getElementById('messageInput');

        if (sendBtn) sendBtn.addEventListener('click', () => this.sendMessage());

        if (messageInput) {
            messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            messageInput.addEventListener('input', () => {
                messageInput.style.height = 'auto';
                messageInput.style.height = Math.min(messageInput.scrollHeight, 128) + 'px';
            });
        }

        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                this.setMode(mode);
            });
        });

        document.querySelectorAll('.suggestion-card').forEach(card => {
            card.addEventListener('click', () => {
                const prompt = card.dataset.prompt;
                document.getElementById('messageInput').value = prompt;
                this.sendMessage();
            });
        });
    },

    setMode(mode) {
        this.currentMode = mode;

        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`.mode-btn[data-mode="${mode}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        const input = document.getElementById('messageInput');
        if (!input) return;

        const placeholders = {
            sohbet: I18n.t('message_placeholder'),
            kod: 'Kodunuzu yazın veya sorunuzu sorun...',
            arastirma: 'Araştırılacak konuyu yazın...'
        };
        input.placeholder = placeholders[mode] || I18n.t('message_placeholder');
    },

    async loadInitialSession() {
        try {
            const response = await fetch('/api/chat/sessions', { credentials: 'include' });
            const data = await response.json();

            if (data.success && data.sessions && data.sessions.length > 0) {
                await this.loadSession(data.sessions[0].id);
            } else {
                await this.newSession();
            }
        } catch (error) {
            console.error('Oturum yüklenemedi:', error);
        }
    },

    async newSession() {
        try {
            const response = await fetch('/api/chat/new', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            const data = await response.json();

            if (data.success) {
                this.currentSessionId = data.session.id;
                this.messages = [];
                this.clearChatArea();
                this.showWelcome();
                Sidebar.loadChatHistory();
            }
        } catch (error) {
            console.error('Yeni oturum oluşturulamadı:', error);
        }
    },

    async loadSession(sessionId) {
        try {
            const response = await fetch(`/api/chat/history?sessionId=${sessionId}`, {
                credentials: 'include'
            });
            const data = await response.json();

            if (data.success) {
                this.currentSessionId = sessionId;
                this.messages = data.messages || [];
                this.renderMessages();

                if (data.session) {
                    this.setMode(data.session.mode || 'sohbet');
                }
                Sidebar.loadChatHistory();
            }
        } catch (error) {
            console.error('Oturum yüklenemedi:', error);
        }
    },

    async deleteSession(sessionId) {
        try {
            const response = await fetch(`/api/chat/session/${sessionId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ sessionId })
            });
            const data = await response.json();

            if (data.success) {
                if (this.currentSessionId === sessionId) await this.newSession();
                Sidebar.loadChatHistory();
            }
        } catch (error) {
            console.error('Oturum silinemedi:', error);
        }
    },

    async sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();

        if (!message) return;
        if (this.isLoading) return;

        this.isLoading = true;

        try {
            this.addMessage('user', message);
            input.value = '';
            input.style.height = 'auto';

            this.hideWelcome();
            const messagesContainer = document.getElementById('messagesContainer');
            if (messagesContainer) messagesContainer.classList.remove('hidden');
            this.showLoading();

            const chatPayload = {
                message,
                mode: this.currentMode,
                sessionId: this.currentSessionId
            };

            const response = await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(chatPayload)
            });

            const data = await response.json();
            this.hideLoading();

            const assistantContent = data.success ? data.message : `❌ Hata: ${data.error || 'Bilinmeyen hata'}`;
            if (assistantContent) this.addMessage('assistant', assistantContent);

            Sidebar.loadChatHistory();
        } catch (error) {
            this.hideLoading();
            this.addMessage('assistant', `❌ Hata: ${error.message || 'İşlem başarısız'}`);
        } finally {
            this.isLoading = false;
        }
    },

    addMessage(role, content) {
        const container = document.getElementById('messagesContainer');
        if (!container) return;

        this.messages.push({ role, content });

        const messageDiv = document.createElement('div');
        messageDiv.className = `message flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

        const formattedContent = role === 'assistant' ? this.formatMarkdown(content) : this.escapeHtml(content);

        messageDiv.innerHTML = `
            <div class="message-content max-w-[85%] md:max-w-[75%] p-3 ${role === 'user' ? 'bg-primary-600' : 'bg-dark-800'}">
                <div class="text-sm leading-relaxed whitespace-pre-wrap ${role === 'assistant' ? 'markdown-body' : ''}">
                    ${formattedContent}
                </div>
                <div class="text-[10px] text-dark-400 mt-1 text-right">
                    ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        `;

        container.appendChild(messageDiv);
        this.scrollToBottom();

        if (role === 'assistant') this.processCodeBlocks(messageDiv);
    },

    processCodeBlocks(container) {
        container.querySelectorAll('pre').forEach(pre => {
            if (pre.closest('.code-block-wrapper')) return;

            const codeBlock = pre.querySelector('code');
            if (!codeBlock) return;

            const langClass = Array.from(codeBlock.classList).find(c => c.startsWith('language-'));
            const langName = langClass ? langClass.replace('language-', '') : 'code';

            const wrapper = document.createElement('div');
            wrapper.className = 'code-block-wrapper';

            const header = document.createElement('div');
            header.className = 'code-header';
            header.innerHTML = `
                <span class="code-lang-label">${langName}</span>
                <button class="copy-code-btn">
                    <i class="fas fa-copy"></i>
                    <span>Kopyala</span>
                </button>
            `;

            header.querySelector('.copy-code-btn').addEventListener('click', () => {
                const code = codeBlock.textContent;
                navigator.clipboard.writeText(code).then(() => {
                    const btn = header.querySelector('.copy-code-btn');
                    btn.innerHTML = '<i class="fas fa-check"></i> <span>Kopyalandı!</span>';
                    btn.classList.add('text-green-400');
                    setTimeout(() => {
                        btn.innerHTML = '<i class="fas fa-copy"></i> <span>Kopyala</span>';
                        btn.classList.remove('text-green-400');
                    }, 2000);
                }).catch(() => {
                    const btn = header.querySelector('.copy-code-btn');
                    btn.innerHTML = '<i class="fas fa-times"></i> <span>Hata</span>';
                    btn.classList.add('text-red-400');
                });
            });

            if (typeof Prism !== 'undefined') Prism.highlightElement(codeBlock);

            wrapper.appendChild(header);
            if (pre.parentNode) {
                pre.parentNode.insertBefore(wrapper, pre);
                wrapper.appendChild(pre);
            }
        });
    },

    renderMessages() {
        const container = document.getElementById('messagesContainer');
        const welcome = document.getElementById('welcomeScreen');

        if (!container) return;

        container.innerHTML = '';

        if (this.messages.length === 0) {
            container.classList.add('hidden');
            if (welcome) welcome.classList.remove('hidden');
            return;
        }

        container.classList.remove('hidden');
        if (welcome) welcome.classList.add('hidden');

        this.messages.forEach(msg => this.addMessage(msg.role, msg.content));
    },

    formatMarkdown(text) {
        if (!text) return '';
        let html = this.escapeHtml(text);

        html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
            return `</p><pre><code class="language-${lang}">${code}</code></pre><p>`;
        });

        html = html.replace(/`([^`]+)`/g, '<code class="bg-dark-700 px-1.5 py-0.5 rounded text-xs text-primary-300">$1</code>');

        html = html.replace(/^### (.+)$/gm, '</p><h3 class="text-base font-semibold text-white mt-4 mb-2">$1</h3><p>');
        html = html.replace(/^## (.+)$/gm, '</p><h2 class="text-lg font-semibold text-white mt-5 mb-2">$1</h2><p>');
        html = html.replace(/^# (.+)$/gm, '</p><h1 class="text-xl font-bold text-white mt-5 mb-3">$1</h1><p>');

        html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

        html = html.replace(/^- (.+)$/gm, '</p><li class="text-dark-200 ml-4 list-disc">$1</li><p>');
        html = html.replace(/^\d+\. (.+)$/gm, '</p><li class="text-dark-200 ml-4 list-decimal">$1</li><p>');

        html = html.replace(/\n/g, ' ');
        html = html.replace(/<\/p>\s*<p>/g, '</p><p>');
        html = html.replace(/<p><\/p>/g, '');

        if (!html.startsWith('<')) html = '<p>' + html + '</p>';

        return html;
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    showLoading() {
        const indicator = document.getElementById('loadingIndicator');
        if (indicator) {
            indicator.classList.remove('hidden');
            const loadingText = indicator.querySelector('span');
            if (loadingText) loadingText.textContent = I18n.t('thinking');
            this.scrollToBottom();
        }
    },

    hideLoading() {
        const indicator = document.getElementById('loadingIndicator');
        if (indicator) indicator.classList.add('hidden');
    },

    showWelcome() {
        const welcome = document.getElementById('welcomeScreen');
        const container = document.getElementById('messagesContainer');
        if (welcome) welcome.classList.remove('hidden');
        if (container) container.classList.add('hidden');
    },

    hideWelcome() {
        const welcome = document.getElementById('welcomeScreen');
        if (welcome) welcome.classList.add('hidden');
    },

    clearChatArea() {
        const container = document.getElementById('messagesContainer');
        if (container) container.innerHTML = '';
    },

    scrollToBottom() {
        const chatArea = document.getElementById('chatArea');
        if (chatArea) {
            setTimeout(() => {
                chatArea.scrollTop = chatArea.scrollHeight;
            }, 100);
        }
    }
};