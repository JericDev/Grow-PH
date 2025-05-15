const path = require('path');
const fs = require('fs');

module.exports.config = {
  name: "warning",
  version: "1.0.1",
  hasPermssion: 0,
  credits: "OpenAI",
  description: "Manually warn a user (admin-only).",
  commandCategory: "admin",
  usages: "[mention/reply/uid]",
  cooldowns: 5
};

const saveFile = path.join(__dirname, 'badwordsActive.json');

let banwordsData = {};
if (fs.existsSync(saveFile)) {
  banwordsData = JSON.parse(fs.readFileSync(saveFile, "utf8"));
}
const saveData = () => fs.writeFileSync(saveFile, JSON.stringify(banwordsData, null, 2), "utf8");

const ensureThreadData = (threadID) => {
  if (!banwordsData[threadID]) {
    banwordsData[threadID] = {
      active: false,
      warnings: {}
    };
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, mentions, reply_message } = event;

  const config = global.config || {};
  const isGlobalAdmin = config.ADMINBOT?.includes(senderID);
  const threadInfo = await api.getThreadInfo(threadID);
  const isGroupAdmin = threadInfo.adminIDs?.some(ad => ad.id === senderID);

  if (!isGlobalAdmin && !isGroupAdmin) {
    return api.sendMessage("⛔ Only group admins or bot owner can use this command.", threadID, messageID);
  }

  ensureThreadData(threadID);
  const threadWarnings = banwordsData[threadID].warnings;

  // Determine target user
  let targetID;
  let targetName;

  if (reply_message) {
    targetID = reply_message.senderID;
    targetName = reply_message.senderName;
  } else if (Object.keys(mentions).length > 0) {
    targetID = Object.keys(mentions)[0];
    targetName = mentions[targetID];
  } else if (args[0]) {
    targetID = args[0];
    targetName = `User ${targetID}`;
  } else {
    return api.sendMessage("❗ Please reply to a message, mention a user, or provide a user ID to warn.", threadID, messageID);
  }

  // Apply warning
  threadWarnings[targetID] = (threadWarnings[targetID] || 0) + 1;
  const currentWarnings = threadWarnings[targetID];
  saveData();

  if (currentWarnings >= 3) {
    api.sendMessage(`❌ ${targetName} has reached 3 warnings and will now be removed.`, threadID);
    return api.removeUserFromGroup(targetID, threadID);
  } else {
    return api.sendMessage(
      `⚠️ ${targetName} has been warned.\nWarning ${currentWarnings}/3.`,
      threadID,
      messageID
    );
  }
};

