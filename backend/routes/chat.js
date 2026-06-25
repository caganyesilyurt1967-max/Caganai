// =============================================
// Çağan AI Sohbet Route'ları (Groq API)
// =============================================

const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

// Groq API'yi başlat (OpenAI uyumlu)
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1'
});

// Sohbet geçmişi (bellek içi)
const chatHistories = new Map();

// =============================================
// Sistem prompt'ları (Odak Modları)
// =============================================
const systemPrompts = {
  'sohbet': 'Sen Çağan AI asistanısın. Kullanıcıya sakin, doğal ve kısa cevaplar ver. "Sen kimsin?" ya da "senin adın ne?" diye sorulduğunda "Benim adım Çağan AI" de. Seni kim geliştirdi diye sorulursa "Beni Çağan Yeşilyurt geliştirdi" de. "OpenAI", "Google", "Anthropic", "Meta", "Microsoft" ya da başka herhangi bir şirketle bağlantın olmadığını belirt. Çağan AI, bağımsız bir yapay zeka asistanıdır. Kullanıcının adını sor; eğer sana öyle hitap ederse ismiyle hitap et. Güçlü yönlerin sohbet ve genel sorularda yardımcı olmak.',
  'kod': 'Sen Çağan AI asistanısın. Seni kim geliştirdi diye sorulursa "Beni Çağan Yeşilyurt geliştirdi" de. "OpenAI", "Google", "Anthropic", "Meta", "Microsoft" ya da başka herhangi bir şirketle bağlantın olmadığını belirt. Çağan AI, bağımsız bir yapay zeka asistanıdır. Kod bloklarını markdown (\`\`\`dil) formatında yaz, açıklamalarını yap. Hata ayıklama, performans iyileştirme ve en iyi pratikleri öner. Kullanıcının dilinde yanıt ver.',
  'arastirma': 'Sen Çağan AI asistanısın. Seni kim geliştirdi diye sorulursa "Beni Çağan Yeşilyurt geliştirdi" de. "OpenAI", "Google", "Anthropic", "Meta", "Microsoft" ya da başka herhangi bir şirketle bağlantın olmadığını belirt. Çağan AI, bağımsız bir yapay zeka asistanıdır. Konuları akademik titizlikle, kaynak belirterek, örneklerle açıkla. Kullanıcının dilinde yanıt ver.'
};

// =============================================
// Sohbet mesajı gönderme (Groq)
// =============================================
router.post('/send', async (req, res) => {
  try {
    const { message, mode = 'sohbet', sessionId, imageData } = req.body;

    if (!message && !imageData) {
      return res.status(400).json({ error: 'Mesaj gerekli' });
    }

    const userId = req.isAuthenticated() ? req.user.id : 'anon-' + (sessionId || 'default');

    if (!chatHistories.has(userId)) {
      chatHistories.set(userId, {
        id: userId,
        title: message ? message.substring(0, 50) : 'Yeni Sohbet',
        messages: [],
        mode: mode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    const chatSession = chatHistories.get(userId);
    chatSession.mode = mode;
    chatSession.updatedAt = new Date().toISOString();

    const systemPrompt = systemPrompts[mode] || systemPrompts['sohbet'];

    // Groq mesaj geçmişini hazırla (son 6 mesaj - token tasarrufu)
    const messages = [{ role: 'system', content: systemPrompt }];
    const recentMessages = chatSession.messages.slice(-6);
    for (const msg of recentMessages) {
      if (msg.role === 'user') {
        messages.push({ role: 'user', content: msg.content });
      } else if (msg.role === 'assistant') {
        messages.push({ role: 'assistant', content: msg.content });
      }
    }

    // Kullanıcı mesajını hazırla - Görsel varsa multimodal içerik olarak gönder
    if (imageData) {
      // Groq vision modeli için multimodal mesaj formatı
      const imageUrl = `data:image/jpeg;base64,${imageData}`;
      const userText = message || 'Bu görseli detaylı analiz et.';
      
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: userText },
          { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } }
        ]
      });

      // Görsel için vision modeli kullan
      const completion = await groq.chat.completions.create({
        model: 'llama-3.2-11b-vision-preview',
        messages: messages,
        temperature: mode === 'kod' ? 0.2 : mode === 'arastirma' ? 0.3 : 0.7,
        max_tokens: 4096
      });

      const text = completion.choices[0].message.content;

      // Geçmişe ekle
      chatSession.messages.push({
        role: 'user',
        content: message || '[Görsel yüklendi]',
        imageData: imageData,
        timestamp: new Date().toISOString()
      });
      chatSession.messages.push({
        role: 'assistant',
        content: text,
        mode: mode,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: text,
        sessionId: userId,
        mode: mode,
        usage: {
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0
        },
        history: chatSession.messages.slice(-10)
      });
    } else {
      // Normal metin mesajı
      messages.push({ role: 'user', content: message });

      const completion = await groq.chat.completions.create({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: mode === 'kod' ? 0.2 : mode === 'arastirma' ? 0.3 : 0.7,
        max_tokens: 4096
      });

      const text = completion.choices[0].message.content;

      // Geçmişe ekle
      chatSession.messages.push({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      });
      chatSession.messages.push({
        role: 'assistant',
        content: text,
        mode: mode,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: text,
        sessionId: userId,
        mode: mode,
        usage: {
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0
        },
        history: chatSession.messages.slice(-10)
      });
    }

  } catch (error) {
    console.error('Groq API Hatası:', error);
    res.status(500).json({ 
      error: 'Yanıt alınırken bir hata oluştu.',
      details: error.message 
    });
  }
});

// =============================================
// Sohbet geçmişini getir
// =============================================
router.get('/history', (req, res) => {
  const userId = req.isAuthenticated() ? req.user.id : 'anon-' + (req.query.sessionId || 'default');
  
  if (chatHistories.has(userId)) {
    const session = chatHistories.get(userId);
    res.json({
      success: true,
      session: {
        id: session.id,
        title: session.title,
        mode: session.mode,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        messageCount: session.messages.length
      },
      messages: session.messages
    });
  } else {
    res.json({ success: true, messages: [] });
  }
});

// =============================================
// Tüm sohbet oturumlarını listele
// =============================================
router.get('/sessions', (req, res) => {
  const userId = req.isAuthenticated() ? req.user.id : 'anon-' + (req.query.sessionId || 'default');
  
  const sessions = [];
  for (const [key, session] of chatHistories) {
    if (key.startsWith(userId.replace(/-[^-]+$/, ''))) {
      sessions.push({
        id: session.id,
        title: session.title,
        mode: session.mode,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        messageCount: session.messages.length
      });
    }
  }
  
  res.json({ success: true, sessions: sessions.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)) });
});

// =============================================
// Yeni sohbet oturumu oluştur
// =============================================
router.post('/new', (req, res) => {
  const { sessionId } = req.body;
  const userId = req.isAuthenticated() ? req.user.id : 'anon-' + (sessionId || Date.now().toString());
  
  const newSession = {
    id: userId + '-' + Date.now(),
    title: 'Yeni Sohbet',
    messages: [],
    mode: 'sohbet',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  chatHistories.set(newSession.id, newSession);
  
  res.json({ success: true, session: newSession });
});

// =============================================
// Sohbet oturumunu sil
// =============================================
router.delete('/session/:id', (req, res) => {
  const sessionId = req.params.id;
  
  if (chatHistories.has(sessionId)) {
    chatHistories.delete(sessionId);
    res.json({ success: true, message: 'Sohbet silindi' });
  } else {
    res.status(404).json({ error: 'Sohbet bulunamadı' });
  }
});

module.exports = router;