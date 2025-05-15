const path = require('path');
const fs = require('fs');

module.exports.config = {
  name: "banwords",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "Jonell Magallanes (Unified by OpenAI)",
  description: "Manage and enforce banned words with warning and kick system",
  commandCategory: "admin",
  usages: "add [word] | remove [word] | list | on | off | warn [userID] | unwarn [userID]",
  cooldowns: 5
};

const saveFile = path.join(__dirname, 'badwordsActive.json');

// Load shared data
let banwordsData = {};
if (fs.existsSync(saveFile)) {
  banwordsData = JSON.parse(fs.readFileSync(saveFile, "utf8"));
}

// Helper functions
const saveData = () => fs.writeFileSync(saveFile, JSON.stringify(banwordsData, null, 2), "utf8");

const getWordFilePath = (threadID) => path.join(__dirname, `../commands/noprefix/${threadID}.json`);
const loadBannedWords = (threadID) => {
  const file = getWordFilePath(threadID);
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf8"));
};
const ensureThreadData = (threadID) => {
  if (!banwordsData[threadID]) {
    banwordsData[threadID] = {
      active: false,
      warnings: {}
    };
  }
};

module.exports.handleEvent = async ({ api, event }) => {
  const { threadID, messageID, senderID, body } = event;
  if (!body) return;

  ensureThreadData(threadID);
  if (!banwordsData[threadID].active) return;

  const config = global.config || {};
  const isGlobalAdmin = config.ADMINBOT?.includes(senderID);
  if (isGlobalAdmin) return;

  const threadInfo = await api.getThreadInfo(threadID);
  const isGroupAdmin = threadInfo.adminIDs?.some(ad => ad.id === senderID);
  if (isGroupAdmin) return;

  const messageContent = body.toLowerCase();
  const bannedWords = loadBannedWords(threadID);
  const matched = bannedWords.some(word => messageContent.includes(word.toLowerCase()));
  if (!matched) return;

  const threadWarnings = banwordsData[threadID].warnings;
  threadWarnings[senderID] = (threadWarnings[senderID] || 0) + 1;
  const currentWarnings = threadWarnings[senderID];
  saveData();

  if (currentWarnings >= 3) {
    api.sendMessage(`❌ You used banned words 3 times. You are now being removed from the group.`, threadID);
    delete threadWarnings[senderID]; // optional: cleanup
    saveData();
    return api.removeUserFromGroup(senderID, threadID);
  } else {
    return api.sendMessage(
      `⚠️ Warning ${currentWarnings}/3\nYour message contains banned words.\nDetected: "${body}"`,
      threadID,
      messageID
    );
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  if (!args[0]) return api.sendMessage("❗ Use: add/remove/list/on/off/warn/unwarn [word/userID]", threadID, messageID);

  const config = global.config || {};
  const isGlobalAdmin = config.ADMINBOT?.includes(senderID);
  const threadInfo = await api.getThreadInfo(threadID);
  const isGroupAdmin = threadInfo.adminIDs?.some(ad => ad.id === senderID);

  if (!isGlobalAdmin && !isGroupAdmin) {
    return api.sendMessage("⛔ Only owner or group admins can manage banned words.", threadID, messageID);
  }

  const action = args[0].toLowerCase();
  const word = args.slice(1).join(" ");
  const wordFilePath = getWordFilePath(threadID);
  const bannedWords = loadBannedWords(threadID);
  ensureThreadData(threadID);

  switch (action) {
    case "add":
      if (!word) return api.sendMessage("❗ Provide a word to ban.", threadID, messageID);
      const lowerWord = word.toLowerCase();
      if (bannedWords.includes(lowerWord)) {
        return api.sendMessage(`⚠️ "${lowerWord}" is already banned.`, threadID, messageID);
      }
      bannedWords.push(lowerWord);
      fs.writeFileSync(wordFilePath, JSON.stringify(bannedWords), "utf8");
      return api.sendMessage(`✅ "${lowerWord}" added to the banned list.`, threadID, messageID);

    case "remove":
      const removeWord = word.toLowerCase();
      const index = bannedWords.indexOf(removeWord);
      if (index === -1) return api.sendMessage(`❌ "${removeWord}" is not in the banned list.`, threadID, messageID);
      bannedWords.splice(index, 1);
      fs.writeFileSync(wordFilePath, JSON.stringify(bannedWords), "utf8");
      return api.sendMessage(`✅ "${removeWord}" removed from the banned list.`, threadID, messageID);

    case "list":
      if (bannedWords.length === 0) return api.sendMessage("📭 No banned words set.", threadID, messageID);
      return api.sendMessage(`📝 Banned words:\n${bannedWords.join(", ")}`, threadID, messageID);

    case "on":
      banwordsData[threadID].active = true;
      saveData();
      return api.sendMessage("✅ Banwords system activated.", threadID, messageID);

    case "off":
      banwordsData[threadID].active = false;
      saveData();
      return api.sendMessage("❎ Banwords system deactivated.", threadID, messageID);

    case "warn":
      const warnUserID = args[1];
      if (!warnUserID) return api.sendMessage("❗ Provide user ID to warn.", threadID, messageID);
      const warnings = banwordsData[threadID].warnings;
      warnings[warnUserID] = (warnings[warnUserID] || 0) + 1;
      const currentWarn = warnings[warnUserID];
      saveData();

      if (currentWarn >= 3) {
        api.sendMessage(`❌ User ${warnUserID} reached 3 warnings and will be removed.`, threadID);
        delete warnings[warnUserID];
        saveData();
        return api.removeUserFromGroup(warnUserID, threadID);
      } else {
        return api.sendMessage(`⚠️ Warning ${currentWarn}/3 issued to user ID ${warnUserID}.`, threadID, messageID);
      }

    case "unwarn":
      const userID = args[1];
      if (!userID) return api.sendMessage("❗ Provide user ID to reset warnings.", threadID, messageID);
      banwordsData[threadID].warnings[userID] = 0;
      saveData();
      return api.sendMessage(`✅ Warnings reset for user ID: ${userID}`, threadID, messageID);

    default:
      return api.sendMessage("❌ Invalid action. Use add, remove, list, on, off, warn, or unwarn.", threadID, messageID);
  }
};
