const fs = require('fs');
const path = require('path');

// Simple in-memory database
let adminDB = {
  premium_admin: "7418584938",
  allowed_users: ["7418584938"],
  pending_requests: []
};

// Bot command handler
function handleBotCommand(message) {
  const chatId = message.chat.id;
  const text = message.text || '';
  const userId = message.from.id.toString();

  console.log('Received command:', text, 'from user:', userId);

  // Start command
  if (text === '/start' || text === '/myid') {
    return {
      chat_id: chatId,
      text: `🤖 **Bot Admin Panel**\n\nYour ID: \`${userId}\`\nPremium Admin: ${userId === adminDB.premium_admin ? '✅' : '❌'}\n\nUse /users to list all users`,
      parse_mode: 'Markdown'
    };
  }

  // List users
  if (text === '/users' && userId === adminDB.premium_admin) {
    const usersList = adminDB.allowed_users.map(id => 
      `• \`${id}\` ${id === adminDB.premium_admin ? '👑' : ''}`
    ).join('\n');
    
    return {
      chat_id: chatId,
      text: `👥 **Allowed Users** (${adminDB.allowed_users.length})\n\n${usersList}`,
      parse_mode: 'Markdown'
    };
  }

  // Add user
  if (text.startsWith('/add') && userId === adminDB.premium_admin) {
    const newUserId = text.split(' ')[1];
    if (newUserId && !adminDB.allowed_users.includes(newUserId)) {
      adminDB.allowed_users.push(newUserId);
      return {
        chat_id: chatId,
        text: `✅ User \`${newUserId}\` added!`,
        parse_mode: 'Markdown'
      };
    }
    return {
      chat_id: chatId,
      text: '❌ Failed to add user',
      parse_mode: 'Markdown'
    };
  }

  // Default response
  return {
    chat_id: chatId,
    text: '❌ Unknown command. Use /start',
    parse_mode: 'Markdown'
  };
}

// Main handler
export default async function handler(req, res) {
  console.log('Webhook received:', req.method, req.body);
  
  if (req.method === 'POST') {
    try {
      const update = req.body;
      
      if (update.message) {
        const response = await handleBotCommand(update.message);
        
        // Send response to Telegram
        const telegramResponse = await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(response)
        });
        
        console.log('Telegram response status:', telegramResponse.status);
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
