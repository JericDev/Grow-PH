const path = require('path');
const fs = require('fs');

let badWordsActive = {}, bannedWords = {}, warnings = {};
const saveFile = path.join(__dirname, 'badwordsActive.json');
if (fs.existsSync(saveFile)) {
  const words = JSON.parse(fs.readFileSync(saveFile, "utf8"));
  badWordsActive = words;
}

const loadBannedWords = threadID => {
  const wordFile = path.join(__dirname, ../commands/noprefix/${threadID}.json);
  if (fs.existsSync(wordFile)) {
    const words = JSON.parse(fs.readFileSync(wordFile, "utf8"));
    bannedWords[threadID] = words;
  } else {
    bannedWords[threadID] = [];
  }
};

module.exports.config = {
  name: "banwords",
  version: "1.0.0",
  hasPermission: 2,
  credits: "Jonell Magallanes",//Fixed By Jonell Magallanes kaya kung mag change credit ka bahala kana sa buhay mo umay par :<
  description: "Manage and enforce banned words",
  commandCategory: "admin",
  usages: "add [word] | remove [word] | list | on | off | unwarn [userID]",
  cooldowns: 5,
};

module.exports.handleEvent = async ({ api, event }) => {
  const { threadID, messageID, senderID, body } = event;
  loadBannedWords(threadID);
  if (!badWordsActive[threadID]) return;

  const messageContent = body.toLowerCase();
  const hasBannedWord = bannedWords[threadID].some(bannedWord => messageContent.includes(bannedWord.toLowerCase()));

  if (hasBannedWord) {
    const threadInfo = await api.getThreadInfo(threadID);
    if (!threadInfo.adminIDs.some(item => item.id === api.getCurrentUserID())) return;

    warnings[senderID] = (warnings[senderID] || 0) + 1;
    if (warnings[senderID] === 3) {
      api.sendMessage("You have Received 3 warnings. You are kicked from the group!", threadID, messageID);
      api.removeUserFromGroup(senderID, threadID);
    } else {
      api.sendMessage(Last Warning! Your message has been detected to contain the banwords "${messageContent}" If you continue to use such language, you will be automatically kicked, threadID, messageID);
    }
  }
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  if (!args[0]) return api.sendMessage("Please specify an action (add, remove, list, on, off, unwarn) and relevant data.", threadID, messageID);

  const isAdmin = (await api.getThreadInfo(threadID)).adminIDs.some(idInfo => idInfo.id === api.getCurrentUserID());
  if (!isAdmin) return api.sendMessage("🛡️ | Bot Need Admin Privilege in short you need to admin the bot to your group chat", threadID, messageID);

  const action = args[0];
  const word = args.slice(1).join(' ');
  loadBannedWords(threadID);

  switch (action) {
    case 'add':
      bannedWords[threadID].push(word);
      fs.writeFileSync(path.join(__dirname, ../commands/noprefix/${threadID}.json), JSON.stringify(bannedWords[threadID]), "utf8");
      return api.sendMessage(✅ |  Word ${word} added to the banwords list., threadID);
    case 'remove':
      const index = bannedWords[threadID].indexOf(word);
      if (index !== -1) {
        bannedWords[threadID].splice(index, 1);
        fs.writeFileSync(path.join(__dirname, ../commands/noprefix/${threadID}.json), JSON.stringify(bannedWords[threadID]), "utf8");
        return api.sendMessage(✅ | Word ${word} removed from the banwords list., threadID);
      } else {
        return api.sendMessage(❌ Word ${word} not found., threadID);
      }
    case 'list':
      return api.sendMessage(📝 | List of banned words: ${bannedWords[threadID].join(', ')}., threadID);
    case 'on':
      badWordsActive[threadID] = true;
      fs.writeFileSync(saveFile, JSON.stringify(badWordsActive), "utf8");
      return api.sendMessage(Banwords has been activated., threadID);
    case 'off':
      badWordsActive[threadID] = false;
      fs.writeFileSync(saveFile, JSON.stringify(badWordsActive), "utf8");
      return api.sendMessage(Banwords has been deactivated., threadID);
    case 'unwarn':
      const userID = args[1];
      if (!userID) return api.sendMessage("Missing user ID for unwarn the member", threadID);
warnings[userID] = 0;
      return api.sendMessage(✅ | User Warnings has been unwarned for Id: ${userID}, threadID);
    default: 
      return api.sendMessage("Invalid action. Please use 'add', 'remove', 'list', 'on', 'off' or 'unwarn'.", threadID);
  }
};
