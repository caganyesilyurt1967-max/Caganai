const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Hugging Face API'sini kullanarak görsel üreten fonksiyon
async function hfGorselUret(prompt) {
    try {
        const apiKey = process.env.HF_API_KEY;
        const model = process.env.HF_IMAGE_MODEL;

        console.log(`Hugging Face (${model}) ile görsel üretiliyor: "${prompt}"`);

        // Hugging Face Inference API'sine istek atıyoruz
        const response = await fetch(
            `https://api-inference.huggingface.co/models/${model}`,
            {
                headers: { 
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                method: "POST",
                body: JSON.stringify({ inputs: prompt }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Hugging Face Hatası: ${response.status} - ${errorText}`);
        }

        // Gelen yanıt resim verisidir
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Resmi projedeki public/uploads klasörüne kaydediyoruz
        const dosyaAdi = `gorsel_${Date.now()}.png`;
        const kayitYolu = path.join(__dirname, '..', '..', 'public', 'uploads', dosyaAdi);

        fs.writeFileSync(kayitYolu, buffer);
        console.log(`Görsel başarıyla kaydedildi: ${kayitYolu}`);

        // Arayüze (Frontend'e) gönderilecek link
        const gorselUrl = `${process.env.SITE_URL || 'http://localhost:3000'}/uploads/${dosyaAdi}`;
        return gorselUrl;

    } catch (error) {
        console.error("Hugging Face görsel üretme fonksiyon hatası:", error);
        throw error;
    }
}

// Arayüzden (Frontend) gelen "Görsel Üret" isteklerini karşılayan rota
router.post('/', async (req, res) => {
    // Frontend'in gönderdiği veriye göre burası 'prompt' veya 'text' olabilir. Genelde prompt'tur.
    const { prompt } = req.body; 

    if (!prompt) {
        return res.status(400).json({ error: "Lütfen bir prompt girin." });
    }

    try {
        const yeniGorselUrl = await hfGorselUret(prompt);
        
        // Arayüze başarılı yanıtı ve görselin linkini dönüyoruz
        // NOT: Eğer ön yüz resmini ekranda gösteremezse, buradaki 'url' kelimesini eski kodunuzda ne yazıyorsa (örn: 'image' veya 'data') onunla değiştirin.
        res.json({ success: true, url: yeniGorselUrl });
    } catch (error) {
        res.status(500).json({ success: false, error: "Görsel üretilemedi." });
    }
});

module.exports = router;