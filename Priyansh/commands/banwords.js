const path = require("path");
const fs = require("fs");

module.exports.config = {
  name: "banwords",
  version: "2.1.0",
  hasPermssion: 0,
  credits: "Unified by OpenAI",
  description: "Ban words with warning and kick system",
  commandCategory: "admin",
  usages: "add [word] | remove [word] | list | on | off | warn [userID] | unwarn [userID] | checkwarn [userID]",
  cooldowns: 5
};

const dataFile = path.join(__dirname, 'banwordsData.json');

let banwordsData = {};
if (fs.existsSync(dataFile)) {
  banwordsData = JSON.parse(fs.readFileSync(dataFile, "utf8"));
}

const saveData = () => fs.writeFileSync(dataFile, JSON.stringify(banwordsData, null, 2), "utf8");

const ensureThreadData = (threadID) => {
  if (!banwordsData[threadID]) {
    banwordsData[threadID] = {
      active: false,
      words: [],
      warnings: {}
    };
  }
};

module.exports.handleEvent = async ({ api, event }) => {
  const { threadID, messageID, senderID, body } = event;
  if (!body) return;

  ensureThreadData(threadID);
  const thread = banwordsData[threadID];
  if (!thread.active) return;

  const config = global.config || {};
  const isAdmin = config.ADMINBOT?.includes(senderID);
  const threadInfo = await api.getThreadInfo(threadID);
  const isGroupAdmin = threadInfo.adminIDs?.some(ad => ad.id === senderID);
  if (isAdmin || isGroupAdmin) return;

  const msg = body.toLowerCase();
  const matched = thread.words.some(word => msg.includes(word.toLowerCase()));
  if (!matched) return;

  thread.warnings[senderID] = (thread.warnings[senderID] || 0) + 1;
  const currentWarnings = thread.warnings[senderID];
  saveData();

  if (currentWarnings >= 3) {
    api.sendMessage(`❌ You used banned words 3 times and will be removed.`, threadID);
    delete thread.warnings[senderID];
    saveData();
    return api.removeUserFromGroup(senderID, threadID);
  } else {
    return api.sendMessage(
      `⚠️ Warning ${currentWarnings}/3\nYou used a banned word.\nDetected: "${body}"`,
      threadID,
      messageID
    );
  }
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;
  if (!args[0]) return api.sendMessage("❗ Use: add/remove/list/on/off/warn/unwarn/checkwarn", threadID, messageID);

  const config = global.config || {};
  const isAdmin = config.ADMINBOT?.includes(senderID);
  const threadInfo = await api.getThreadInfo(threadID);
  const isGroupAdmin = threadInfo.adminIDs?.some(ad => ad.id === senderID);

  if (!isAdmin && !isGroupAdmin) {
    return api.sendMessage("⛔ Only bot owner or group admins can use this command.", threadID, messageID);
  }

  const action = args[0].toLowerCase();
  const thread = (ensureThreadData(threadID), banwordsData[threadID]);

  switch (action) {
    case "add": {
      const word = args.slice(1).join(" ").toLowerCase();
      if (!word) return api.sendMessage("❗ Provide a word to ban.", threadID, messageID);
      if (thread.words.includes(word)) return api.sendMessage(`⚠️ "${word}" is already banned.`, threadID, messageID);
      thread.words.push(word);
      saveData();
      return api.sendMessage(`✅ "${word}" added to banned words.`, threadID, messageID);
    }

    case "remove": {
      const word = args.slice(1).join(" ").toLowerCase();
      const index = thread.words.indexOf(word);
      if (index === -1) return api.sendMessage(`❌ "${word}" is not in the list.`, threadID, messageID);
      thread.words.splice(index, 1);
      saveData();
      return api.sendMessage(`✅ "${word}" removed.`, threadID, messageID);
    }

    case "list": {
      if (thread.words.length === 0) return api.sendMessage("📭 No banned words yet.", threadID, messageID);
      return api.sendMessage(`📝 Banned Words:\n${thread.words.join(", ")}`, threadID, messageID);
    }

    case "on":
      thread.active = true;
      saveData();
      return api.sendMessage("✅ Banwords system activated.", threadID, messageID);

    case "off":
      thread.active = false;
      saveData();
      return api.sendMessage("❎ Banwords system deactivated.", threadID, messageID);

    case "warn": {
      const userID = args[1];
      if (!userID) return api.sendMessage("❗ Provide user ID to warn.", threadID, messageID);
      thread.warnings[userID] = (thread.warnings[userID] || 0) + 1;
      const warns = thread.warnings[userID];
      saveData();

      if (warns >= 3) {
        api.sendMessage(`❌ User ${userID} has 3 warnings and will be removed.`, threadID);
        delete thread.warnings[userID];
        saveData();
        return api.removeUserFromGroup(userID, threadID);
      } else {
        return api.sendMessage(`⚠️ User ${userID} now has ${warns}/3 warnings.`, threadID, messageID);
      }
    }

    case "unwarn": {
      const userID = args[1];
      if (!userID) return api.sendMessage("❗ Provide user ID to clear warnings.", threadID, messageID);
      if (!thread.warnings[userID]) {
        return api.sendMessage(`ℹ️ User ${userID} has no warnings.`, threadID, messageID);
      }
      delete thread.warnings[userID];
      saveData();
      return api.sendMessage(`✅ Cleared all warnings for user ${userID}.`, threadID, messageID);
    }

    case "checkwarn": {
      const userID = args[1];
      if (!userID) return api.sendMessage("❗ Provide user ID to check.", threadID, messageID);
      const count = thread.warnings[userID] || 0;
      return api.sendMessage(`ℹ️ User ${userID} has ${count}/3 warnings.`, threadID, messageID);
    }

    default:
      return api.sendMessage("❌ Invalid action. Use add/remove/list/on/off/warn/unwarn/checkwarn", threadID, messageID);
  }
};
