const fs = require('fs');
const path = require('path');

const ADMIN_DB_PATH = path.join(process.cwd(), 'admin-db.json');

// Load database
function loadDB() {
  try {
    if (fs.existsSync(ADMIN_DB_PATH)) {
      return JSON.parse(fs.readFileSync(ADMIN_DB_PATH, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading DB:', error);
  }
  
  // Default database
  return { 
    premium_admin: "7418584938", 
    allowed_users: ["7418584938"], 
    pending_requests: [] 
  };
}

// Save database
function saveDB(data) {
  try {
    fs.writeFileSync(ADMIN_DB_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving DB:', error);
    return false;
  }
}

// Check if user is premium admin
function isPremiumAdmin(userId) {
  const db = loadDB();
  return db.premium_admin === userId.toString();
}

// Check if user is allowed
function isUserAllowed(userId) {
  const db = loadDB();
  return db.allowed_users.includes(userId.toString());
}

// Add new user
function addUser(userId) {
  const db = loadDB();
  const userIdStr = userId.toString();
  
  if (!db.allowed_users.includes(userIdStr)) {
    db.allowed_users.push(userIdStr);
    return saveDB(db);
  }
  return false;
}

// Remove user
function removeUser(userId) {
  const db = loadDB();
  const userIdStr = userId.toString();
  const index = db.allowed_users.indexOf(userIdStr);
  
  if (index > -1 && userIdStr !== db.premium_admin) {
    db.allowed_users.splice(index, 1);
    return saveDB(db);
  }
  return false;
}

// Get all users
function getAllUsers() {
  const db = loadDB();
  return {
    premium_admin: db.premium_admin,
    allowed_users: db.allowed_users
  };
}

// Bot command handler
async function handleBotCommand(message) {
  const chatId = message.chat.id;
  const text = message.text || '';
  const userId = message.from.id.toString();

  // Start command
  if (text === '/start') {
    const isAdmin = isPremiumAdmin(userId);
    return {
      text: `🤖 **Admin Bot Panel**\n\n` +
            `Premium Admin: ${isAdmin ? '✅' : '❌'}\n` +
            `Your ID: \`${userId}\`\n` +
            `Status: ${isUserAllowed(userId) ? '✅ Allowed' : '❌ Not Allowed'}\n\n` +
            `**Commands:**\n` +
            `${isAdmin ? '/users - List all users\n' : ''}` +
            `${isAdmin ? '/add [id] - Add user\n' : ''}` +
            `${isAdmin ? '/remove [id] - Remove user\n' : ''}` +
            `/myid - Show your ID`,
      parse_mode: 'Markdown'
    };
  }

  // Show user ID
  if (text === '/myid') {
    return {
      text: `Your Telegram ID: \`${userId}\``,
      parse_mode: 'Markdown'
    };
  }

  // List users (admin only)
  if (text === '/users' && isPremiumAdmin(userId)) {
    const users = getAllUsers();
    const usersList = users.allowed_users.map(id => 
      `• \`${id}\` ${id === users.premium_admin ? '👑' : ''}`
    ).join('\n');
    
    return {
      text: `👥 **Allowed Users** (${users.allowed_users.length})\n\n${usersList}`,
      parse_mode: 'Markdown'
    };
  }

  // Add user (premium admin only)
  if (text.startsWith('/add') && isPremiumAdmin(userId)) {
    const parts = text.split(' ');
    if (parts.length === 2) {
      const newUserId = parts[1];
      if (addUser(newUserId)) {
        return { 
          text: `✅ User \`${newUserId}\` added successfully!`,
          parse_mode: 'Markdown'
        };
      }
    }
    return { text: '❌ Usage: /add [user_id]', parse_mode: 'Markdown' };
  }

  // Remove user (premium admin only)
  if (text.startsWith('/remove') && isPremiumAdmin(userId)) {
    const parts = text.split(' ');
    if (parts.length === 2) {
      const removeUserId = parts[1];
      if (removeUser(removeUserId)) {
        return { 
          text: `✅ User \`${removeUserId}\` removed!`,
          parse_mode: 'Markdown'
        };
      }
    }
    return { text: '❌ Usage: /remove [user_id]', parse_mode: 'Markdown' };
  }

  return { 
    text: '❌ Unknown command. Use /start to see available commands.',
    parse_mode: 'Markdown'
  };
}

module.exports = { 
  handleBotCommand, 
  isUserAllowed,
  isPremiumAdmin,
  getAllUsers
};
