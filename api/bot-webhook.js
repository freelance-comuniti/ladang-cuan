const { handleBotCommand } = require('../../bot-admin');

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const update = req.body;
      
      if (update.message) {
        const response = await handleBotCommand(update.message);
        
        // Send response back to Telegram
        await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: update.message.chat.id,
            text: response.text,
            parse_mode: response.parse_mode
          })
        });
      }
      
      res.status(200).json({ ok: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
            }
