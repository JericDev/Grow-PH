const path = require("path");
const fs = require("fs");

module.exports.config = {
  name: "banwords",
  version: "1.0.2",
  hasPermission: 2, // only group admins can use this
  credits: "Jonell Magallanes (Fixed by OpenAI)",
  description: "Manage and enforce banned words with warning and kick system",
  commandCategory: "admin",
  usages: "add [word] | remove [word] | list | on | off | unwarn [userID]",
  cooldowns: 5,
};

let badWordsActive = {};
let bannedWords = {};
let warnings = {};
const saveFile = path.join(__dirname, "badwordsActive.json");

// Load active state
if (fs.existsSync(saveFile)) {
  try {
    badWordsActive = JSON.parse(fs.readFileSync(saveFile, "utf8"));
  } catch {
    badWordsActive = {};
  }
}

const getWordFilePath = (threadID) =>
  path.join(__dirname, `../commands/noprefix/${threadID}.json`);

const loadBannedWords = (threadID) => {
  const filePath = getWordFilePath(threadID);
  if (fs.existsSync(filePath)) {
    try {
      bannedWords[threadID] = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch {
      bannedWords[threadID] = [];
    }
  } else {
    bannedWords[threadID] = [];
  }
};

module.exports.handleEvent = async ({ api, event }) => {
  const { threadID, messageID, senderID, body } = event;
  if (!body) return;

  loadBannedWords(threadID);
  if (!badWordsActive[threadID]) return;

  const messageContent = body.toLowerCase();
  const matched = bannedWords[threadID].some(word =>
    messageContent.includes(word.toLowerCase())
  );
  if (!matched) return;

  const threadInfo = await api.getThreadInfo(threadID);

  // ✅ Bypass punishment if sender is group admin
  const isSenderAdmin = threadInfo.adminIDs.some(admin => admin.id === senderID);
  if (isSenderAdmin) return;

  // ✅ Ensure bot has admin rights before kicking
  const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === api.getCurrentUserID());
  if (!isBotAdmin) return;

  // Initialize warnings if needed
  warnings[threadID] = warnings[threadID] || {};
  warnings[threadID][senderID] = (warnings[threadID][senderID] || 0) + 1;

  const currentWarnings = warnings[threadID][senderID];

  if (currentWarnings >= 3) {
    api.sendMessage(
      `❌ You used banned words 3 times. You are being removed from the group.`,
      threadID
    );
    return api.removeUserFromGroup(senderID, threadID);
  } else {
    return api.sendMessage(
      `⚠️ Warning ${currentWarnings}/3: Your message contains banned words.\nIf you reach 3, you will be removed.\nDetected: "${body}"`,
      threadID,
      messageID
    );
  }
};

module.exports.run = async function ({ api, event, args, Users, Threads }) {
  const { threadID, messageID, senderID } = event;

  if (!args[0]) {
    return api.sendMessage(
      "❗ Use: add/remove/list/on/off/unwarn [word/userID]",
      threadID,
      messageID
    );
  }

  const action = args[0].toLowerCase();
  const word = args.slice(1).join(" ");
  const wordFilePath = getWordFilePath(threadID);
  loadBannedWords(threadID);

  // ✅ Check if sender is group admin
  const threadInfo = await api.getThreadInfo(threadID);
  const isGroupAdmin = threadInfo.adminIDs.some(ad => ad.id === senderID);

  // ✅ Optional: also allow global bot admins (if config.ADMINBOT is defined)
  const config = global.config || {};
  const isGlobalAdmin =
    config.ADMINBOT && Array.isArray(config.ADMINBOT)
      ? config.ADMINBOT.some(id => id.toString() === senderID)
      : false;

  if (!isGroupAdmin && !isGlobalAdmin) {
    return api.sendMessage("🛡️ Only group or bot admins can use this command.", threadID, messageID);
  }

  switch (action) {
    case "add":
      if (!word) return api.sendMessage("❗ Provide a word to ban.", threadID, messageID);
      if (bannedWords[threadID].includes(word)) {
        return api.sendMessage(`⚠️ "${word}" is already banned.`, threadID, messageID);
      }
      bannedWords[threadID].push(word);
      fs.writeFileSync(wordFilePath, JSON.stringify(bannedWords[threadID]), "utf8");
      return api.sendMessage(`✅ Banned word added: "${word}"`, threadID, messageID);

    case "remove":
      const index = bannedWords[threadID].indexOf(word);
      if (index === -1) {
        return api.sendMessage(`❌ "${word}" not found in list.`, threadID, messageID);
      }
      bannedWords[threadID].splice(index, 1);
      fs.writeFileSync(wordFilePath, JSON.stringify(bannedWords[threadID]), "utf8");
      return api.sendMessage(`✅ Removed: "${word}"`, threadID, messageID);

    case "list":
      if (bannedWords[threadID].length === 0) {
        return api.sendMessage("📭 No banned words set.", threadID, messageID);
      }
      return api.sendMessage(
        `📝 Banned words:\n${bannedWords[threadID].join(", ")}`,
        threadID,
        messageID
      );

    case "on":
      badWordsActive[threadID] = true;
      fs.writeFileSync(saveFile, JSON.stringify(badWordsActive), "utf8");
      return api.sendMessage("✅ Banwords system activated.", threadID, messageID);

    case "off":
      badWordsActive[threadID] = false;
      fs.writeFileSync(saveFile, JSON.stringify(badWordsActive), "utf8");
      return api.sendMessage("❎ Banwords system deactivated.", threadID, messageID);

    case "unwarn":
      const userID = args[1];
      if (!userID) return api.sendMessage("❗ Provide user ID.", threadID, messageID);
      warnings[threadID] = warnings[threadID] || {};
      warnings[threadID][userID] = 0;
      return api.sendMessage(`✅ Warnings reset for user ID: ${userID}`, threadID, messageID);

    default:
      return api.sendMessage(
        "❌ Invalid action. Use: add, remove, list, on, off, unwarn",
        threadID,
        messageID
      );
  }
};
