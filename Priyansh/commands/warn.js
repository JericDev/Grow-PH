const path = require('path');
const fs = require('fs');

module.exports.config = {
  name: "warn",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "You + OpenAI",
  description: "Warn users manually; warnings combined with banwords system",
  commandCategory: "admin",
  usages: "warn <reply|mention|uid>",
  cooldowns: 5
};

const saveFile = path.join(__dirname, 'badwordsActive.json');

let banwordsData = {};
if (fs.existsSync(saveFile)) {
  banwordsData = JSON.parse(fs.readFileSync(saveFile, "utf8"));
}

function saveBanwordsData() {
  fs.writeFileSync(saveFile, JSON.stringify(banwordsData, null, 2), "utf8");
}

function ensureThreadData(threadID) {
  if (!banwordsData[threadID]) {
    banwordsData[threadID] = {
      active: false,
      warnings: {}
    };
  }
}

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, mentions, type, messageReply } = event;
  const config = global.config || {};
  const isGlobalAdmin = config.ADMINBOT?.includes(senderID);

  // Fetch thread admins
  const threadInfo = await api.getThreadInfo(threadID);
  const adminIDs = threadInfo.adminIDs || [];
  const isGroupAdmin = adminIDs.some(ad => ad.id === senderID);

  // Only admin or global admin can warn
  if (!isGlobalAdmin && !isGroupAdmin) {
    return api.sendMessage("⛔ Only owner or group admins can use this command.", threadID, messageID);
  }

  // Determine user to warn
  let userToWarn;

  if (type === "message_reply" && messageReply) {
    userToWarn = messageReply.senderID;
  } else if (mentions && Object.keys(mentions).length > 0) {
    userToWarn = Object.keys(mentions)[0];
  } else if (args[1]) {
    userToWarn = args[1];
  }

  if (!userToWarn) {
    return api.sendMessage("❗ Please reply to a message, mention a user, or provide a user ID to warn.", threadID, messageID);
  }

  ensureThreadData(threadID);

  // Increment warning
  banwordsData[threadID].warnings[userToWarn] = (banwordsData[threadID].warnings[userToWarn] || 0) + 1;
  saveBanwordsData();

  const warnCount = banwordsData[threadID].warnings[userToWarn];

  if (warnCount >= 3) {
    await api.sendMessage(`❌ User has reached 3 warnings and will be removed from the group.`, threadID);
    await api.removeUserFromGroup(userToWarn, threadID);
  } else {
    await api.sendMessage(`⚠️ Warning ${warnCount}/3 for user.`, threadID, messageID);
  }
};
