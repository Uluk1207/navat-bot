/**
 * 🌿 Нават Чайканасы — Борбордук Сервер
 * Веб-сайт + Admin панель + Telegram Bot бирге
 */

const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const TOKEN = '8811802507:AAGD9JRbPd6WGdURe1jRMOXKEiuD9-_lPMo';

// ========== ADMIN TELEGRAM ID ==========
// BotFather'дан /start деп жазып өз ID'иңизди билиңиз
// https://t.me/userinfobot аркылуу ID алсаңыз болот
const ADMIN_CHAT_ID = '5262750640'; // Мис: '123456789'

const bot = new TelegramBot(TOKEN, { polling: true });

// ========== ADMIN ID АНЫКТОО ==========
// Ботко жазганда терминалда Chat ID чыгат
// Ошол санды ADMIN_CHAT_ID га коюңуз
bot.on('message', (msg) => {
  if (!ADMIN_CHAT_ID) {
    console.log('👤 Chat ID:', msg.chat.id, '|', msg.chat.first_name || '');
    console.log('💡 server.js де ADMIN_CHAT_ID га ушул санды коюңуз!');
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ========== МААЛЫМАТ ФАЙЛДАРЫ ==========
const ORDERS_FILE = path.join(__dirname, 'orders.json');
const BOOKINGS_FILE = path.join(__dirname, 'bookings.json');

function readData(file) {
  if (!fs.existsSync(file)) fs.writeFileSync(file, '[]');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function writeData(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ========== REST API ==========

// Тапсырыштар
app.get('/api/orders', (req, res) => {
  res.json(readData(ORDERS_FILE));
});

app.post('/api/orders', (req, res) => {
  const orders = readData(ORDERS_FILE);
  const order = {
    id: 'ORD-' + Date.now().toString().slice(-6),
    ...req.body,
    status: 'new',
    createdAt: new Date().toLocaleString('ru-RU')
  };
  orders.unshift(order);
  writeData(ORDERS_FILE, orders);

  // Admin'га Telegram билдирүүсү жибер
  const cartText = order.cart.map(i => `  • ${i.emoji} ${i.ат} x${i.сан} = ${i.баа * i.сан} сом`).join('\n');
  const total = order.cart.reduce((s, i) => s + i.баа * i.сан, 0);

  notifyAdmin(
    `🛒 *Жаңы тапсырыш!* №${order.id}\n\n` +
    `👤 Аты: ${order.name}\n` +
    `📞 Тел: ${order.phone}\n` +
    `📦 Ыкма: ${order.type}\n` +
    (order.address ? `📍 Дарек: ${order.address}\n` : '') +
    `\n🍽️ Тапсырыш:\n${cartText}\n\n` +
    `💰 *Жалпы: ${total} сом*\n` +
    `🕐 ${order.createdAt}`
  );

  res.json({ success: true, order });
});

app.patch('/api/orders/:id', (req, res) => {
  const orders = readData(ORDERS_FILE);
  const idx = orders.findIndex(o => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Табылган жок' });
  orders[idx] = { ...orders[idx], ...req.body };
  writeData(ORDERS_FILE, orders);

  const statusNames = { preparing: 'Иштелүүдө', ready: 'Даяр ✅', done: 'Аяктады' };
  if (req.body.status && statusNames[req.body.status]) {
    notifyAdmin(`📦 Тапсырыш №${req.params.id} → *${statusNames[req.body.status]}*`);
  }

  res.json({ success: true });
});

// Брондоолор
app.get('/api/bookings', (req, res) => {
  res.json(readData(BOOKINGS_FILE));
});

app.post('/api/bookings', (req, res) => {
  const bookings = readData(BOOKINGS_FILE);
  const booking = {
    id: 'BOOK-' + Date.now().toString().slice(-6),
    ...req.body,
    status: 'pending',
    createdAt: new Date().toLocaleString('ru-RU')
  };
  bookings.unshift(booking);
  writeData(BOOKINGS_FILE, bookings);

  notifyAdmin(
    `📅 *Жаңы бронь!* №${booking.id}\n\n` +
    `👤 Аты: ${booking.name}\n` +
    `📞 Тел: ${booking.phone}\n` +
    `📅 Дата: ${booking.date}\n` +
    `🕐 Убакыт: ${booking.time}\n` +
    `👥 Адам саны: ${booking.persons}\n` +
    `🕐 ${booking.createdAt}`
  );

  res.json({ success: true, booking });
});

app.patch('/api/bookings/:id', (req, res) => {
  const bookings = readData(BOOKINGS_FILE);
  const idx = bookings.findIndex(b => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Табылган жок' });
  bookings[idx] = { ...bookings[idx], ...req.body };
  writeData(BOOKINGS_FILE, bookings);
  res.json({ success: true });
});

// Admin'га билдирүү жибер
function notifyAdmin(text) {
  if (!ADMIN_CHAT_ID) return;
  console.log('📤 Admin га жиберилүүдө:', ADMIN_CHAT_ID);
  bot.sendMessage(ADMIN_CHAT_ID, text, { parse_mode: 'Markdown' })
    .then(() => console.log('✅ Admin га жетти!'))
    .catch(err => console.log('❌ Ката:', err.message));
}

// ========== TELEGRAM BOT ==========
const MENU = {
  "☕ Чай жана кофе": [
    { ат: "Кок чай", баа: 50, emoji: "🍵" },
    { ат: "Кара чай", баа: 50, emoji: "☕" },
    { ат: "Капучино", баа: 120, emoji: "☕" },
    { ат: "Латте", баа: 130, emoji: "☕" },
    { ат: "Эспрессо", баа: 80, emoji: "☕" },
  ],
  "🍽️ Негизги тамактар": [
    { ат: "Лагман", баа: 250, emoji: "🍜" },
    { ат: "Манты", баа: 200, emoji: "🥟" },
    { ат: "Шашлык (100г)", баа: 180, emoji: "🍢" },
    { ат: "Плов", баа: 220, emoji: "🍚" },
    { ат: "Самса", баа: 80, emoji: "🥐" },
    { ат: "Бешбармак", баа: 350, emoji: "🍖" },
  ],
  "🥗 Салаттар": [
    { ат: "Ачык-чачык", баа: 120, emoji: "🥗" },
    { ат: "Цезарь", баа: 180, emoji: "🥗" },
    { ат: "Нан", баа: 30, emoji: "🍞" },
  ],
  "🥤 Суусундуктар": [
    { ат: "Компот", баа: 60, emoji: "🥤" },
    { ат: "Сок", баа: 150, emoji: "🧃" },
    { ат: "Айран", баа: 70, emoji: "🥛" },
  ],
};

const userState = {};
function getUser(id) {
  if (!userState[id]) userState[id] = { step: 'main', cart: [], booking: {} };
  return userState[id];
}

const mainKeyboard = {
  reply_markup: {
    keyboard: [
      ['🍽️ Меню', '🛒 Тапсырыш берүү'],
      ['📅 Стол брондоо', 'ℹ️ Биз жөнүндө'],
      ['🌐 Веб-сайт'],
    ],
    resize_keyboard: true,
  },
};

bot.onText(/\/start/, (msg) => {
  const id = msg.chat.id;
  userState[id] = { step: 'main', cart: [], booking: {} };
  bot.sendMessage(id,
    '🌿 *Нават Чайканасына Кош Келиңиз!*\n\n👇 Баскычтарды колдонуңуз:',
    { parse_mode: 'Markdown', ...mainKeyboard }
  );
});

bot.on('message', (msg) => {
  if (!msg.text || msg.text.startsWith('/')) return;
  const id = msg.chat.id;
  const user = getUser(id);
  const text = msg.text;

  if (user.step === 'order_name') { user.orderName = text; user.step = 'order_phone'; return bot.sendMessage(id, '📞 Телефон номериңизди жазыңыз:'); }
  if (user.step === 'order_phone') {
    user.orderPhone = text;
    if (user.orderType === 'Жеткирүү') { user.step = 'order_address'; return bot.sendMessage(id, '📍 Дарекиңизди жазыңыз:'); }
    return finalizeBotOrder(id, user);
  }
  if (user.step === 'order_address') { user.orderAddress = text; return finalizeBotOrder(id, user); }
  if (user.step === 'book_name') { user.booking.name = text; user.step = 'book_phone'; return bot.sendMessage(id, '📞 Телефон:'); }
  if (user.step === 'book_phone') { user.booking.phone = text; return finalizeBotBooking(id, user); }

  switch (text) {
    case '🍽️ Меню':
      bot.sendMessage(id, '📋 *Меню* — категорияны тандаңыз:', {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: Object.keys(MENU).map(c => [{ text: c, callback_data: `cat_${c}` }]) }
      });
      break;
    case '🛒 Тапсырыш берүү':
      if (!user.cart.length) return bot.sendMessage(id, '🛒 Себет бош! Менюдан тандаңыз.', { reply_markup: { inline_keyboard: Object.keys(MENU).map(c => [{ text: c, callback_data: `cat_${c}` }]) } });
      showCart(id, user);
      break;
    case '📅 Стол брондоо':
      startBooking(id, user);
      break;
    case '🌐 Веб-сайт':
      bot.sendMessage(id, `🌐 Веб-сайтыбыз:\nhttp://localhost:${PORT}\n\nБраузерден меню көрүп тапсырыш берсеңиз болот!`);
      break;
    case 'ℹ️ Биз жөнүндө':
      bot.sendMessage(id, '🌿 *Нават Чайканасы*\n📍 Ленин 45, Ош\n🕐 09:00-23:00\n📞 +996 700 123 456', { parse_mode: 'Markdown', ...mainKeyboard });
      break;
  }
});

bot.on('callback_query', (q) => {
  const id = q.message.chat.id;
  const msgId = q.message.message_id;
  const data = q.data;
  const user = getUser(id);
  bot.answerCallbackQuery(q.id);

  if (data.startsWith('cat_')) {
    const cat = data.replace('cat_', '');
    const items = MENU[cat] || [];
    bot.editMessageText(`*${cat}*\n\nТамак тандаңыз:`, {
      chat_id: id, message_id: msgId, parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: items.map(i => [{ text: `${i.emoji} ${i.ат} — ${i.баа} сом`, callback_data: `add_${cat}|${i.ат}` }]).concat([[{ text: '🔙 Артка', callback_data: 'back' }]]) }
    });
  } else if (data.startsWith('add_')) {
    const [cat, name] = data.replace('add_', '').split('|');
    const item = (MENU[cat] || []).find(i => i.ат === name);
    if (item) {
      const ex = user.cart.find(c => c.ат === name);
      if (ex) ex.сан++; else user.cart.push({ ...item, сан: 1 });
      const total = user.cart.reduce((s, i) => s + i.баа * i.сан, 0);
      bot.editMessageText(`✅ *${item.ат}* кошулду!\n🛒 Жалпы: *${total} сом*`, {
        chat_id: id, message_id: msgId, parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '🛒 Себетти тастыктоо', callback_data: 'view_cart' }], [{ text: '➕ Дагы кош', callback_data: `cat_${cat}` }]] }
      });
    }
  } else if (data === 'view_cart' || data === 'back_cart') {
    showCartInline(id, msgId, user);
  } else if (data === 'confirm_order') {
    bot.editMessageText('📦 Кандай алгыңыз келет?', {
      chat_id: id, message_id: msgId,
      reply_markup: { inline_keyboard: [[{ text: '🏠 Жеткирүү', callback_data: 'type_delivery' }, { text: '🏪 Алып кетүү', callback_data: 'type_pickup' }]] }
    });
  } else if (data === 'type_delivery' || data === 'type_pickup') {
    user.orderType = data === 'type_delivery' ? 'Жеткирүү' : 'Алып кетүү';
    user.step = 'order_name';
    bot.editMessageText('👤 Атыңызды жазыңыз:', { chat_id: id, message_id: msgId });
  } else if (data === 'back') {
    bot.editMessageText('📋 Категория:', {
      chat_id: id, message_id: msgId,
      reply_markup: { inline_keyboard: Object.keys(MENU).map(c => [{ text: c, callback_data: `cat_${c}` }]) }
    });
  } else if (data.startsWith('bdate_')) {
    user.booking.date = data.replace('bdate_', '');
    showTimePicker(id, msgId, user);
  } else if (data.startsWith('btime_')) {
    user.booking.time = data.replace('btime_', '');
    showPersonsPicker(id, msgId, user);
  } else if (data.startsWith('bpers_')) {
    user.booking.persons = data.replace('bpers_', '');
    user.step = 'book_name';
    bot.editMessageText(`📅 ${user.booking.date} | 🕐 ${user.booking.time} | 👥 ${user.booking.persons} адам\n\n👤 Атыңызды жазыңыз:`, { chat_id: id, message_id: msgId });
  }
});

function showCart(id, user) {
  const total = user.cart.reduce((s, i) => s + i.баа * i.сан, 0);
  let text = '🛒 *Себет:*\n\n';
  user.cart.forEach(i => { text += `${i.emoji} ${i.ат} x${i.сан} = ${i.баа * i.сан} сом\n`; });
  text += `\n💰 *Жалпы: ${total} сом*`;
  bot.sendMessage(id, text, {
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: [[{ text: '✅ Тапсырыш берүү', callback_data: 'confirm_order' }], [{ text: '🗑️ Тазалоо', callback_data: 'clear_cart' }]] }
  });
}

function showCartInline(id, msgId, user) {
  const total = user.cart.reduce((s, i) => s + i.баа * i.сан, 0);
  let text = '🛒 *Себет:*\n\n';
  user.cart.forEach(i => { text += `${i.emoji} ${i.ат} x${i.сан} = ${i.баа * i.сан} сом\n`; });
  text += `\n💰 *Жалпы: ${total} сом*`;
  bot.editMessageText(text, {
    chat_id: id, message_id: msgId, parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: [[{ text: '✅ Тапсырыш берүү', callback_data: 'confirm_order' }]] }
  });
}

function finalizeBotOrder(id, user) {
  const total = user.cart.reduce((s, i) => s + i.баа * i.сан, 0);
  const orderData = {
    name: user.orderName,
    phone: user.orderPhone,
    type: user.orderType,
    address: user.orderAddress || '—',
    cart: user.cart,
    source: 'Telegram'
  };

  fetch(`http://localhost:${PORT}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  }).then(r => r.json()).then(data => {
    bot.sendMessage(id,
      `✅ *Тапсырыш кабыл алынды!*\n🔖 №${data.order.id}\n💰 ${total} сом\n⏱️ 30-45 мүнөт`,
      { parse_mode: 'Markdown', ...mainKeyboard }
    );
  }).catch(() => {
    bot.sendMessage(id, '✅ Тапсырышыңыз кабыл алынды! Рахмат!', mainKeyboard);
  });

  user.cart = [];
  user.step = 'main';
}

function startBooking(id, user) {
  user.booking = {};
  const days = ['Жек', 'Дүй', 'Шей', 'Шар', 'Бей', 'Жум', 'Иш'];
  const buttons = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() + i);
    const label = i === 0 ? `Бүгүн ${d.getDate()}` : i === 1 ? `Эртең ${d.getDate()}` : `${days[d.getDay()]} ${d.getDate()}`;
    const val = `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}`;
    buttons.push([{ text: label, callback_data: `bdate_${val}` }]);
  }
  bot.sendMessage(id, '📅 Күн тандаңыз:', { reply_markup: { inline_keyboard: buttons } });
}

function showTimePicker(id, msgId, user) {
  const times = ['11:00','12:00','13:00','14:00','15:00','17:00','18:00','19:00','20:00','21:00'];
  const buttons = [];
  for (let i = 0; i < times.length; i += 3) {
    buttons.push(times.slice(i, i+3).map(t => ({ text: t, callback_data: `btime_${t}` })));
  }
  bot.editMessageText(`📅 ${user.booking.date}\n\n🕐 Убакытты тандаңыз:`, { chat_id: id, message_id: msgId, reply_markup: { inline_keyboard: buttons } });
}

function showPersonsPicker(id, msgId, user) {
  const buttons = [];
  for (let i = 1; i <= 12; i += 3) {
    buttons.push([i,i+1,i+2].filter(n=>n<=12).map(n => ({ text: `${n} адам`, callback_data: `bpers_${n}` })));
  }
  bot.editMessageText(`📅 ${user.booking.date} | 🕐 ${user.booking.time}\n\n👥 Адам санын тандаңыз:`, { chat_id: id, message_id: msgId, reply_markup: { inline_keyboard: buttons } });
}

function finalizeBotBooking(id, user) {
  const b = user.booking;
  fetch(`http://localhost:${PORT}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: b.name, phone: b.phone, date: b.date, time: b.time, persons: b.persons, source: 'Telegram' })
  }).then(r => r.json()).then(data => {
    bot.sendMessage(id,
      `✅ *Бронь ырасталды!*\n🔖 №${data.booking.id}\n📅 ${b.date} | 🕐 ${b.time} | 👥 ${b.persons} адам`,
      { parse_mode: 'Markdown', ...mainKeyboard }
    );
  }).catch(() => {
    bot.sendMessage(id, '✅ Бронь кабыл алынды! Рахмат!', mainKeyboard);
  });
  user.booking = {};
  user.step = 'main';
}

// ========== СЕРВЕР ИШТЕТҮҮ ==========
app.listen(PORT, () => {
  console.log(`🌿 Нават Чайканасы сервери иштеп жатат!`);
  console.log(`📱 Веб-сайт:    http://localhost:${PORT}`);
  console.log(`👑 Admin панель: http://localhost:${PORT}/admin.html`);
  console.log(`🤖 Telegram Bot: иштеп жатат...`);
  console.log(`\n⚠️  ADMIN_CHAT_ID орнотуу үчүн: https://t.me/userinfobot`);
});
