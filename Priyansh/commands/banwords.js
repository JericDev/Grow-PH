const path = require('path');
const fs = require('fs');

let badWordsActive = {};
let bannedWords = {};
let warnings = {};
const saveFile = path.join(__dirname, 'badwordsActive.json');

// Load active thread settings
if (fs.existsSync(saveFile)) {
  badWordsActive = JSON.parse(fs.readFileSync(saveFile, "utf8"));
}

// Get banned words file path for a thread
const getWordFilePath = (threadID) => path.join(__dirname, `../commands/noprefix/${threadID}.json`);

// Load banned words for a thread
const loadBannedWords = (threadID) => {
  const wordFile = getWordFilePath(threadID);
  if (fs.existsSync(wordFile)) {
    bannedWords[threadID] = JSON.parse(fs.readFileSync(wordFile, "utf8"));
  } else {
    bannedWords[threadID] = [];
  }
};

module.exports.config = {
  name: "banwords",
  version: "1.0.0",
  hasPermission: 2,
  credits: "Jonell Magallanes (Edited by OpenAI)",
  description: "Manage and enforce banned words with warning and kick system",
  commandCategory: "admin",
  usages: "add [word] | remove [word] | list | on | off | unwarn [userID]",
  cooldowns: 5,
};

module.exports.handleEvent = async ({ api, event }) => {
  const { threadID, messageID, senderID, body } = event;
  if (!body) return;

  loadBannedWords(threadID);
  if (!badWordsActive[threadID]) return;

  const messageContent = body.toLowerCase();
  const matched = bannedWords[threadID].some(word => messageContent.includes(word.toLowerCase()));
  if (!matched) return;

  const threadInfo = await api.getThreadInfo(threadID);
  if (!threadInfo.adminIDs.some(admin => admin.id === api.getCurrentUserID())) return;

  // Init warning tracking per thread
  warnings[threadID] = warnings[threadID] || {};
  warnings[threadID][senderID] = (warnings[threadID][senderID] || 0) + 1;

  const currentWarnings = warnings[threadID][senderID];

  if (currentWarnings >= 3) {
    api.sendMessage(`❌ You used banned words 3 times. You are now being removed from the group.`, threadID, messageID);
    return api.removeUserFromGroup(senderID, threadID);
  } else {
    return api.sendMessage(
      `⚠️ Warning ${currentWarnings}/3: Your message contains banned words.\nIf you reach 3 warnings, you will be kicked.\nDetected: "${body}"`,
      threadID,
      messageID
    );
  }
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  if (!args[0]) {
    return api.sendMessage("❗ Please use: add/remove/list/on/off/unwarn [word/userID]", threadID, messageID);
  }

  const threadInfo = await api.getThreadInfo(threadID);
  const isAdmin = threadInfo.adminIDs.some(ad => ad.id === api.getCurrentUserID());
  if (!isAdmin) {
    return api.sendMessage("🛡️ Bot needs to be an admin to manage banwords.", threadID, messageID);
  }

  const action = args[0].toLowerCase();
  const word = args.slice(1).join(" ");
  const wordFilePath = getWordFilePath(threadID);
  loadBannedWords(threadID);

  switch (action) {
    case "add":
      if (!word) return api.sendMessage("❗ Please provide a word to ban.", threadID, messageID);
      if (bannedWords[threadID].includes(word)) {
        return api.sendMessage(`⚠️ The word "${word}" is already banned.`, threadID, messageID);
      }
      bannedWords[threadID].push(word);
      fs.writeFileSync(wordFilePath, JSON.stringify(bannedWords[threadID]), "utf8");
      return api.sendMessage(`✅ Word "${word}" added to the banned list.`, threadID, messageID);

    case "remove":
      const index = bannedWords[threadID].indexOf(word);
      if (index === -1) return api.sendMessage(`❌ Word "${word}" is not in the banned list.`, threadID, messageID);
      bannedWords[threadID].splice(index, 1);
      fs.writeFileSync(wordFilePath, JSON.stringify(bannedWords[threadID]), "utf8");
      return api.sendMessage(`✅ Word "${word}" removed from the banned list.`, threadID, messageID);

    case "list":
      if (bannedWords[threadID].length === 0) return api.sendMessage("📭 No banned words currently set.", threadID, messageID);
      return api.sendMessage(`📝 Banned words:\n${bannedWords[threadID].join(", ")}`, threadID, messageID);

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
      if (!userID) return api.sendMessage("❗ Please provide the user ID to reset warnings.", threadID, messageID);
      warnings[threadID] = warnings[threadID] || {};
      warnings[threadID][userID] = 0;
      return api.sendMessage(`✅ Warnings reset for user ID: ${userID}`, threadID, messageID);

    default:
      return api.sendMessage("❌ Invalid action. Use add, remove, list, on, off, unwarn.", threadID, messageID);
  }
};
