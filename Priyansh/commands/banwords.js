const path = require('path');
const fs = require('fs');

module.exports.config = {
  name: "banwords",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "Jonell Magallanes (Unified by OpenAI)",
  description: "Manage and enforce banned words with warning and kick system",
  commandCategory: "admin",
  usages: "add [word] | remove [word] | list | on | off | warn [userID] | unwarn [userID] | checkwarn [userID]",
  cooldowns: 5
};

const activeFilePath = path.join(__dirname, 'badwordsActive.json');
const bannedWordsFolder = path.join(__dirname, '../commands/noprefix');

// Ensure banned words folder exists
if (!fs.existsSync(bannedWordsFolder)) {
  fs.mkdirSync(bannedWordsFolder, { recursive: true });
}

// Load active data (warnings + on/off)
let banwordsData = {};
if (fs.existsSync(activeFilePath)) {
  try {
    banwordsData = JSON.parse(fs.readFileSync(activeFilePath, "utf8"));
  } catch (e) {
    console.error('Failed to parse badwordsActive.json:', e);
  }
}

// Save banwordsData back to disk
const saveData = () => {
  try {
    fs.writeFileSync(activeFilePath, JSON.stringify(banwordsData, null, 2), "utf8");
  } catch (e) {
    console.error('Failed to write badwordsActive.json:', e);
  }
};

// Get file path for a thread's banned words list
const getWordFilePath = (threadID) => path.join(bannedWordsFolder, `${threadID}.json`);

// Load banned words for a thread
const loadBannedWords = (threadID) => {
  const file = getWordFilePath(threadID);
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    console.error(`Failed to parse banned words for thread ${threadID}:`, e);
    return [];
  }
};

// Save banned words list for a thread
const saveBannedWords = (threadID, words) => {
  const file = getWordFilePath(threadID);
  try {
    fs.writeFileSync(file, JSON.stringify(words, null, 2), "utf8");
  } catch (e) {
    console.error(`Failed to write banned words for thread ${threadID}:`, e);
  }
};

// Ensure thread data structure exists
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

  // Skip global bot admins
  const config = global.config || {};
  const isGlobalAdmin = config.ADMINBOT?.includes(senderID);
  if (isGlobalAdmin) return;

  // Skip group admins
  const threadInfo = await api.getThreadInfo(threadID);
  const isGroupAdmin = threadInfo.adminIDs?.some(ad => ad.id === senderID);
  if (isGroupAdmin) return;

  const messageContent = body.toLowerCase();
  const bannedWords = loadBannedWords(threadID);
  if (!bannedWords.length) return;

  // Check if any banned word is in the message
  const matched = bannedWords.some(word => messageContent.includes(word.toLowerCase()));
  if (!matched) return;

  const threadWarnings = banwordsData[threadID].warnings;
  threadWarnings[senderID] = (threadWarnings[senderID] || 0) + 1;
  const currentWarnings = threadWarnings[senderID];
  saveData();

  if (currentWarnings >= 3) {
    api.sendMessage(`❌ You have used banned words 3 times. You will be removed from the group.`, threadID);
    delete threadWarnings[senderID];
    saveData();
    return api.removeUserFromGroup(senderID, threadID);
  } else {
    return api.sendMessage(
      `⚠️ Warning ${currentWarnings}/3\nYour message contains banned words.\nDetected message: "${body}"`,
      threadID,
      messageID
    );
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  if (!args[0]) return api.sendMessage("❗ Usage: add/remove/list/on/off/warn/unwarn/checkwarn [word/userID]", threadID, messageID);

  const config = global.config || {};
  const isGlobalAdmin = config.ADMINBOT?.includes(senderID);
  const threadInfo = await api.getThreadInfo(threadID);
  const isGroupAdmin = threadInfo.adminIDs?.some(ad => ad.id === senderID);

  if (!isGlobalAdmin && !isGroupAdmin) {
    return api.sendMessage("⛔ Only bot owner or group admins can manage banned words.", threadID, messageID);
  }

  const action = args[0].toLowerCase();
  const wordOrUser = args.slice(1).join(" ");
  const bannedWords = loadBannedWords(threadID);
  ensureThreadData(threadID);

  switch (action) {
    case "add": {
      if (!wordOrUser) return api.sendMessage("❗ Please provide a word to ban.", threadID, messageID);
      const lowerWord = wordOrUser.toLowerCase();
      if (bannedWords.includes(lowerWord)) {
        return api.sendMessage(`⚠️ "${lowerWord}" is already banned.`, threadID, messageID);
      }
      bannedWords.push(lowerWord);
      saveBannedWords(threadID, bannedWords);
      return api.sendMessage(`✅ "${lowerWord}" added to the banned words list.`, threadID, messageID);
    }

    case "remove": {
      if (!wordOrUser) return api.sendMessage("❗ Please provide a word to remove.", threadID, messageID);
      const lowerWord = wordOrUser.toLowerCase();
      const index = bannedWords.indexOf(lowerWord);
      if (index === -1) return api.sendMessage(`❌ "${lowerWord}" is not in the banned words list.`, threadID, messageID);
      bannedWords.splice(index, 1);
      saveBannedWords(threadID, bannedWords);
      return api.sendMessage(`✅ "${lowerWord}" removed from the banned words list.`, threadID, messageID);
    }

    case "list": {
      if (bannedWords.length === 0) return api.sendMessage("📭 No banned words set for this thread.", threadID, messageID);
      return api.sendMessage(`📝 Banned words:\n${bannedWords.join(", ")}`, threadID, messageID);
    }

    case "on": {
      banwordsData[threadID].active = true;
      saveData();
      return api.sendMessage("✅ Banwords system activated for this thread.", threadID, messageID);
    }

    case "off": {
      banwordsData[threadID].active = false;
      saveData();
      return api.sendMessage("❎ Banwords system deactivated for this thread.", threadID, messageID);
    }

    case "warn": {
      if (!wordOrUser) return api.sendMessage("❗ Provide user ID to warn.", threadID, messageID);
      const warnings = banwordsData[threadID].warnings;
      warnings[wordOrUser] = (warnings[wordOrUser] || 0) + 1;
      const currentWarn = warnings[wordOrUser];
      saveData();

      if (currentWarn >= 3) {
        api.sendMessage(`❌ User ${wordOrUser} reached 3 warnings and will be removed.`, threadID);
        delete warnings[wordOrUser];
        saveData();
        return api.removeUserFromGroup(wordOrUser, threadID);
      } else {
        return api.sendMessage(`⚠️ Warning ${currentWarn}/3 issued to user ID ${wordOrUser}.`, threadID, messageID);
      }
    }

    case "unwarn": {
      if (!wordOrUser) return api.sendMessage("❗ Provide user ID to reset warnings.", threadID, messageID);
      if (banwordsData[threadID].warnings[wordOrUser]) {
        delete banwordsData[threadID].warnings[wordOrUser];
        saveData();
        return api.sendMessage(`✅ Warnings fully cleared for user ID: ${wordOrUser}`, threadID, messageID);
      } else {
        return api.sendMessage(`ℹ️ User ID ${wordOrUser} has no warnings.`, threadID, messageID);
      }
    }

    case "checkwarn": {
      if (!wordOrUser) return api.sendMessage("❗ Provide a user ID to check warnings.", threadID, messageID);
      const checkWarnings = banwordsData[threadID].warnings[wordOrUser];
      if (!checkWarnings) {
        return api.sendMessage(`ℹ️ User ID ${wordOrUser} has no warnings.`, threadID, messageID);
      } else {
        return api.sendMessage(`⚠️ User ID ${wordOrUser} has ${checkWarnings}/3 warnings.`, threadID, messageID);
      }
    }

    default:
      return api.sendMessage("❌ Invalid action. Use add, remove, list, on, off, warn, unwarn, or checkwarn.", threadID, messageID);
  }
};
