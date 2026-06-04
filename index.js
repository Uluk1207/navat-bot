/**
 * 🌿 Нават Чайканасы — Telegram Боту
 * Node.js версиясы
 * Меню + Тапсырыш + Стол Брондоо
 */

const TelegramBot = require("node-telegram-bot-api");

// ========== ТОКЕН ==========
const TOKEN = "8811802507:AAGD9JRbPd6WGdURe1jRMOXKEiuD9-_lPMo";
const bot = new TelegramBot(TOKEN, { polling: true });

// ========== МЕНЮ ==========
const MENU = {
  "☕ Чай жана кофе": [
    { ат: "Кок чай", баа: 50, emoji: "🍵" },
    { ат: "Кара чай", баа: 50, emoji: "☕" },
    { ат: "Зеленый чай", баа: 60, emoji: "🍵" },
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
    { ат: "Чий", баа: 100, emoji: "🥙" },
  ],
  "🥤 Суусундуктар": [
    { ат: "Компот", баа: 60, emoji: "🥤" },
    { ат: "Свежевыжатый сок", баа: 150, emoji: "🧃" },
    { ат: "Минералдык суу", баа: 50, emoji: "💧" },
    { ат: "Айран", баа: 70, emoji: "🥛" },
  ],
};

// ========== КОЛДОНУУЧУ МААЛЫМАТТАРЫ ==========
// Ар бир колдонуучунун абалын сактоо
const userState = {}; // { chatId: { step, cart, booking, ... } }

function getUser(chatId) {
  if (!userState[chatId]) {
    userState[chatId] = { step: "main", cart: [], booking: {} };
  }
  return userState[chatId];
}

// ========== КЛАВИАТУРА ==========
const mainKeyboard = {
  reply_markup: {
    keyboard: [
      ["🍽️ Меню", "🛒 Тапсырыш берүү"],
      ["📅 Стол брондоо", "ℹ️ Биз жөнүндө"],
      ["📞 Байланыш"],
    ],
    resize_keyboard: true,
  },
};

function menuCategoriesKeyboard() {
  const buttons = Object.keys(MENU).map((cat) => [
    { text: cat, callback_data: `cat_${cat}` },
  ]);
  buttons.push([{ text: "🔙 Артка", callback_data: "back_main" }]);
  return { inline_keyboard: buttons };
}

function categoryItemsKeyboard(category) {
  const items = MENU[category] || [];
  const buttons = items.map((item) => [
    {
      text: `${item.emoji} ${item.ат} — ${item.баа} сом`,
      callback_data: `item_${category}|${item.ат}`,
    },
  ]);
  buttons.push([{ text: "🔙 Категорияларга", callback_data: "back_categories" }]);
  return { inline_keyboard: buttons };
}

function itemDetailKeyboard(category, itemName) {
  return {
    inline_keyboard: [
      [{ text: "🛒 Себетке кош", callback_data: `add_${category}|${itemName}` }],
      [{ text: "🔙 Артка", callback_data: `cat_${category}` }],
    ],
  };
}

function cartKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "✅ Тапсырышты ырастоо", callback_data: "confirm_order" }],
      [{ text: "🗑️ Себетти тазалоо", callback_data: "clear_cart" }],
      [{ text: "➕ Дагы кош", callback_data: "back_categories" }],
    ],
  };
}

function orderTypeKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "🏠 Жеткирүү", callback_data: "order_delivery" }],
      [{ text: "🏪 Алып кетүү", callback_data: "order_pickup" }],
    ],
  };
}

function bookingDatesKeyboard() {
  const buttons = [];
  const days = ["Жек", "Дүй", "Шей", "Шар", "Бей", "Жум", "Иш"];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const label =
      i === 0
        ? `Бүгүн ${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")}`
        : i === 1
        ? `Эртең ${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")}`
        : `${days[d.getDay()]} ${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
    const val = `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
    buttons.push([{ text: label, callback_data: `bdate_${val}` }]);
  }
  buttons.push([{ text: "❌ Жокко чыгаруу", callback_data: "cancel_booking" }]);
  return { inline_keyboard: buttons };
}

function bookingTimesKeyboard() {
  const times = ["11:00","12:00","13:00","14:00","15:00","17:00","18:00","19:00","20:00","21:00"];
  const buttons = [];
  for (let i = 0; i < times.length; i += 3) {
    buttons.push(
      times.slice(i, i + 3).map((t) => ({ text: t, callback_data: `btime_${t}` }))
    );
  }
  return { inline_keyboard: buttons };
}

function bookingPersonsKeyboard() {
  const buttons = [];
  for (let i = 1; i <= 12; i += 3) {
    buttons.push(
      [i, i+1, i+2].filter(n => n <= 12).map((n) => ({
        text: `${n} адам`,
        callback_data: `bpers_${n}`,
      }))
    );
  }
  return { inline_keyboard: buttons };
}

function bookingConfirmKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "✅ Ырастоо", callback_data: "confirm_booking" }],
      [{ text: "❌ Жокко чыгаруу", callback_data: "cancel_booking" }],
    ],
  };
}

// ========== СЕБЕТ ТЕКСТИ ==========
function cartText(cart) {
  if (!cart.length) return "🛒 Себетиңиз бош!";
  let text = "🛒 *Сиздин Себет:*\n\n";
  let total = 0;
  for (const item of cart) {
    const sub = item.баа * item.сан;
    text += `${item.emoji} ${item.ат} x${item.сан} = ${sub} сом\n`;
    total += sub;
  }
  text += `\n💰 *Жалпы: ${total} сом*`;
  return text;
}

// ========== /START ==========
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  userState[chatId] = { step: "main", cart: [], booking: {} };
  bot.sendMessage(
    chatId,
    "🌿 *Нават Чайканасына Кош Келиңиз!*\n\nСизге кантип жардам бере алабыз?\n\n👇 Төмөндөгү баскычтарды колдонуңуз:",
    { parse_mode: "Markdown", ...mainKeyboard }
  );
});

// ========== ТЕКСТ БИЛДИРҮҮЛӨР ==========
bot.on("message", (msg) => {
  if (!msg.text || msg.text.startsWith("/")) return;
  const chatId = msg.chat.id;
  const user = getUser(chatId);
  const text = msg.text;

  // Адам аты киргизүү
  if (user.step === "order_name") {
    user.orderName = text;
    user.step = "order_phone";
    return bot.sendMessage(chatId, "📞 *Телефон номериңизди* жазыңыз (+996...):", { parse_mode: "Markdown" });
  }
  if (user.step === "order_phone") {
    user.orderPhone = text;
    if (user.orderType === "Жеткирүү") {
      user.step = "order_address";
      return bot.sendMessage(chatId, "📍 *Дарекиңизди* жазыңыз:", { parse_mode: "Markdown" });
    } else {
      return finalizeOrder(chatId, user);
    }
  }
  if (user.step === "order_address") {
    user.orderAddress = text;
    return finalizeOrder(chatId, user);
  }
  if (user.step === "book_name") {
    user.booking.аты = text;
    user.step = "book_phone";
    return bot.sendMessage(chatId, "📞 *Телефон номериңизди* жазыңыз (+996...):", { parse_mode: "Markdown" });
  }
  if (user.step === "book_phone") {
    user.booking.телефон = text;
    user.step = "book_confirm";
    const b = user.booking;
    return bot.sendMessage(
      chatId,
      `📋 *Брондоо маалыматы:*\n\n📅 Дата: ${b.дата}\n🕐 Убакыт: ${b.убакыт}\n👥 Адам саны: ${b.адам}\n👤 Аты: ${b.аты}\n📞 Телефон: ${b.телефон}\n\nМаалымат туурабы?`,
      { parse_mode: "Markdown", reply_markup: bookingConfirmKeyboard() }
    );
  }

  // Негизги баскычтар
  switch (text) {
    case "🍽️ Меню":
      user.step = "menu";
      bot.sendMessage(chatId, "📋 *Биздин Меню*\n\nКатегорияны тандаңыз:", {
        parse_mode: "Markdown",
        reply_markup: menuCategoriesKeyboard(),
      });
      break;

    case "🛒 Тапсырыш берүү":
      if (!user.cart.length) {
        user.step = "menu";
        bot.sendMessage(chatId, "🛒 Себетиңиз бош!\n\nАлгач менюдан тамак тандаңыз:", {
          reply_markup: menuCategoriesKeyboard(),
        });
      } else {
        user.step = "cart";
        bot.sendMessage(chatId, cartText(user.cart), {
          parse_mode: "Markdown",
          reply_markup: cartKeyboard(),
        });
      }
      break;

    case "📅 Стол брондоо":
      user.booking = {};
      user.step = "book_date";
      bot.sendMessage(chatId, "📅 *Стол Брондоо*\n\nКүндү тандаңыз:", {
        parse_mode: "Markdown",
        reply_markup: bookingDatesKeyboard(),
      });
      break;

    case "ℹ️ Биз жөнүндө":
      bot.sendMessage(
        chatId,
        "🌿 *Нават Чайканасы*\n\n📍 Дарек: Ош шаары, Ленин көчөсү 45\n🕐 Иш убакыты: 09:00 - 23:00\n📞 Телефон: +996 700 123 456\n🌐 Instagram: @nawat_chaikhanasy\n\n✨ Өзбек жана кыргыз дасторкондун эң мыкты тамактары!",
        { parse_mode: "Markdown", ...mainKeyboard }
      );
      break;

    case "📞 Байланыш":
      bot.sendMessage(
        chatId,
        "📞 *Байланыш маалыматы*\n\n📱 Телефон: +996 700 123 456\n📱 WhatsApp: +996 700 123 456\n📧 Email: nawat@mail.com\n📍 Дарек: Ош шаары, Ленин көчөсү 45",
        { parse_mode: "Markdown", ...mainKeyboard }
      );
      break;

    default:
      bot.sendMessage(chatId, "❓ Төмөндөгү баскычтарды колдонуңуз:", mainKeyboard);
  }
});

// ========== CALLBACK QUERY (Inline баскычтар) ==========
bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;
  const msgId = query.message.message_id;
  const data = query.data;
  const user = getUser(chatId);

  bot.answerCallbackQuery(query.id);

  // --- МЕНЮ КАТЕГОРИЯЛАР ---
  if (data.startsWith("cat_")) {
    const category = data.replace("cat_", "");
    user.currentCategory = category;
    bot.editMessageText(`*${category}*\n\nТамак тандаңыз:`, {
      chat_id: chatId,
      message_id: msgId,
      parse_mode: "Markdown",
      reply_markup: categoryItemsKeyboard(category),
    });
  }

  // --- ТАМАК ДЕТАЛДАРЫ ---
  else if (data.startsWith("item_")) {
    const [category, itemName] = data.replace("item_", "").split("|");
    const item = (MENU[category] || []).find((i) => i.ат === itemName);
    if (!item) return;
    bot.editMessageText(
      `${item.emoji} *${item.ат}*\n\n💰 Баасы: *${item.баа} сом*\n\nСебетке кошуу үчүн баскычты басыңыз.`,
      {
        chat_id: chatId,
        message_id: msgId,
        parse_mode: "Markdown",
        reply_markup: itemDetailKeyboard(category, itemName),
      }
    );
  }

  // --- СЕБЕТКЕ КОШ ---
  else if (data.startsWith("add_")) {
    const [category, itemName] = data.replace("add_", "").split("|");
    const item = (MENU[category] || []).find((i) => i.ат === itemName);
    if (!item) return;

    const existing = user.cart.find((c) => c.ат === itemName);
    if (existing) existing.сан += 1;
    else user.cart.push({ ...item, сан: 1 });

    const total = user.cart.reduce((s, i) => s + i.баа * i.сан, 0);
    bot.editMessageText(
      `✅ *${item.ат}* себетке кошулду!\n\n🛒 Себеттеги буюмдар: ${user.cart.length} түр\n💰 Жалпы: *${total} сом*`,
      {
        chat_id: chatId,
        message_id: msgId,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🛒 Себетти көрүү", callback_data: "view_cart" }],
            [{ text: "➕ Дагы кош", callback_data: `cat_${category}` }],
            [{ text: "🔙 Менюга", callback_data: "back_categories" }],
          ],
        },
      }
    );
  }

  // --- СЕБЕТТИ КӨР ---
  else if (data === "view_cart") {
    bot.editMessageText(cartText(user.cart), {
      chat_id: chatId,
      message_id: msgId,
      parse_mode: "Markdown",
      reply_markup: cartKeyboard(),
    });
  }

  // --- СЕБЕТТИ ТАЗАЛА ---
  else if (data === "clear_cart") {
    user.cart = [];
    bot.editMessageText("🗑️ Себет тазаланды!", {
      chat_id: chatId,
      message_id: msgId,
    });
  }

  // --- ТАПСЫРЫШТЫ ЫРАСТОО ---
  else if (data === "confirm_order") {
    user.step = "order_type";
    bot.editMessageText("📦 *Тапсырыш ыкмасы*\n\nКандай алгыңыз келет?", {
      chat_id: chatId,
      message_id: msgId,
      parse_mode: "Markdown",
      reply_markup: orderTypeKeyboard(),
    });
  }

  // --- ЖЕТКИРҮҮ / АЛЫП КЕТҮҮ ---
  else if (data === "order_delivery" || data === "order_pickup") {
    user.orderType = data === "order_delivery" ? "Жеткирүү" : "Алып кетүү";
    user.step = "order_name";
    bot.editMessageText("👤 *Атыңызды* жазыңыз:", {
      chat_id: chatId,
      message_id: msgId,
      parse_mode: "Markdown",
    });
  }

  // --- АРТКА БАСКЫЧТАРЫ ---
  else if (data === "back_categories") {
    bot.editMessageText("📋 *Меню*\n\nКатегорияны тандаңыз:", {
      chat_id: chatId,
      message_id: msgId,
      parse_mode: "Markdown",
      reply_markup: menuCategoriesKeyboard(),
    });
  }

  // ============ БРОНДОО ============

  // --- КҮН ТАНДОО ---
  else if (data.startsWith("bdate_")) {
    user.booking.дата = data.replace("bdate_", "");
    bot.editMessageText(
      `📅 Дата: *${user.booking.дата}*\n\n🕐 Убакытты тандаңыз:`,
      {
        chat_id: chatId,
        message_id: msgId,
        parse_mode: "Markdown",
        reply_markup: bookingTimesKeyboard(),
      }
    );
  }

  // --- УБАКЫТ ТАНДОО ---
  else if (data.startsWith("btime_")) {
    user.booking.убакыт = data.replace("btime_", "");
    bot.editMessageText(
      `📅 Дата: *${user.booking.дата}*\n🕐 Убакыт: *${user.booking.убакыт}*\n\n👥 Адам санын тандаңыз:`,
      {
        chat_id: chatId,
        message_id: msgId,
        parse_mode: "Markdown",
        reply_markup: bookingPersonsKeyboard(),
      }
    );
  }

  // --- АДАМ САНЫ ---
  else if (data.startsWith("bpers_")) {
    user.booking.адам = data.replace("bpers_", "");
    user.step = "book_name";
    bot.editMessageText(
      `📅 Дата: *${user.booking.дата}*\n🕐 Убакыт: *${user.booking.убакыт}*\n👥 Адам саны: *${user.booking.адам}*\n\n👤 *Атыңызды* жазыңыз:`,
      {
        chat_id: chatId,
        message_id: msgId,
        parse_mode: "Markdown",
      }
    );
  }

  // --- БРОНДООНУ ЫРАСТОО ---
  else if (data === "confirm_booking") {
    const b = user.booking;
    const bookingId = `BOOK-${Date.now().toString().slice(-6)}`;
    bot.editMessageText(
      `✅ *Бронь ырасталды!*\n\n🔖 Бронь №: \`${bookingId}\`\n📅 Дата: ${b.дата}\n🕐 Убакыт: ${b.убакыт}\n👥 Адам саны: ${b.адам}\n👤 Аты: ${b.аты}\n📞 Телефон: ${b.телефон}\n\nБиз сизди ${b.убакыт} да күтөбүз! 🌿\nСуроолор: +996 700 123 456`,
      {
        chat_id: chatId,
        message_id: msgId,
        parse_mode: "Markdown",
      }
    );
    user.booking = {};
    user.step = "main";
  }

  // --- БРОНДООНУ ЖОККО ЧЫГАР ---
  else if (data === "cancel_booking") {
    user.booking = {};
    user.step = "main";
    bot.editMessageText("❌ Брондоо жокко чыгарылды.", {
      chat_id: chatId,
      message_id: msgId,
    });
  }
});

// ========== ТАПСЫРЫШТЫ АЯКТОО ==========
function finalizeOrder(chatId, user) {
  const total = user.cart.reduce((s, i) => s + i.баа * i.сан, 0);
  const orderId = `ORD-${Date.now().toString().slice(-6)}`;

  let text = `✅ *Тапсырышыңыз кабыл алынды!*\n\n`;
  text += `🔖 Тапсырыш №: \`${orderId}\`\n`;
  text += `👤 Аты: ${user.orderName}\n`;
  text += `📞 Тел: ${user.orderPhone}\n`;
  text += `📦 Ыкма: ${user.orderType}\n`;
  if (user.orderAddress) text += `📍 Дарек: ${user.orderAddress}\n`;
  text += `\n🛒 *Тапсырыш:*\n`;
  for (const item of user.cart) {
    text += `  • ${item.ат} x${item.сан} = ${item.баа * item.сан} сом\n`;
  }
  text += `\n💰 *Жалпы: ${total} сом*\n`;
  text += `⏱️ *Болжолдуу убакыт: 30-45 мүнөт*\n\nРахмат! 🍽️`;

  user.cart = [];
  user.step = "main";

  bot.sendMessage(chatId, text, { parse_mode: "Markdown", ...mainKeyboard });
}

console.log("🌿 Нават Чайканасы боту иштеп жатат... (Node.js)");
