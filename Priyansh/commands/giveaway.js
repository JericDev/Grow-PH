const fs = require("fs");

module.exports.config = {
  name: "giveaway",
  version: "1.0.0",
  permission: 2, // Admin only
  credits: "Jeric - Refactored by ChatGPT",
  description: "Simple giveaway system",
  prefix: true,
  premium: false,
  category: "utility",
  usages: "[create/details/join/roll/end] [ID]",
  cooldowns: 5,
};

module.exports.handleReaction = async ({ api, event, Users, handleReaction }) => {
  let data = global.data.GiveAway.get(handleReaction.ID);
  if (!data || data.status === "close" || data.status === "ended") return;

  const userID = event.userID;
  const hasReacted = typeof event.reaction !== "undefined";
  const threadInfo = await api.getThreadInfo(event.threadID);
  const userName = threadInfo.nicknames?.[userID] || (await Users.getInfo(userID)).name;

  if (hasReacted) {
    if (!data.joined.includes(userID)) data.joined.push(userID);
    api.sendMessage(`${userName} successfully joined the giveaway (ID: #${handleReaction.ID})`, event.threadID);
  } else {
    const index = data.joined.indexOf(userID);
    if (index !== -1) data.joined.splice(index, 1);
    api.sendMessage(`${userName} left the giveaway (ID: #${handleReaction.ID})`, event.threadID);
  }

  global.data.GiveAway.set(handleReaction.ID, data);
};

module.exports.run = async ({ api, event, args, Users, botid }) => {
  const senderID = event.senderID;
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (!global.config.ADMINBOT.includes(senderID) &&
     (!global.config.GIVEAWAYVIP || !global.config.GIVEAWAYVIP.includes(senderID))) {
    return api.sendMessage("❌ You don't have permission to use this command.", threadID, messageID);
  }

  if (!global.data.GiveAway) global.data.GiveAway = new Map();

  switch (args[0]) {
    case "create": {
      const reward = args.slice(1).join(" ");
      if (!reward) return api.sendMessage("🎁 Please enter the prize!", threadID, messageID);

      const ID = Math.floor(100000 + Math.random() * 900000).toString();
      const threadInfo = await api.getThreadInfo(threadID);
      const authorName = threadInfo.nicknames?.[senderID] || (await Users.getInfo(senderID)).name;

      api.sendMessage(
        `🎉 NEW GIVEAWAY 🎉\n👤 Host: ${authorName}\n🎁 Prize: ${reward}\n🆔 GID: #${ID}\n\n✅ React to this message to join!`,
        threadID,
        (err, info) => {
          if (err) return;
          global.data.GiveAway.set(ID, {
            ID,
            author: authorName,
            authorID: senderID,
            messageID: info.messageID,
            reward,
            joined: [],
            status: "open"
          });
          global.client.handleReaction.push({
            name: this.config.name,
            messageID: info.messageID,
            author: senderID,
            ID
          });
        }
      );
      break;
    }

    case "details": {
      const ID = args[1]?.replace("#", "");
      if (!ID) return api.sendMessage("📌 Please provide a GiveAway ID.", threadID, messageID);

      const data = global.data.GiveAway.get(ID);
      if (!data) return api.sendMessage("❗GiveAway not found with that ID.", threadID, messageID);

      api.sendMessage(
        `📋 GIVEAWAY DETAILS 📋\n👤 Host: ${data.author} (${data.authorID})\n🎁 Prize: ${data.reward}\n🆔 GID: #${data.ID}\n👥 Participants: ${data.joined.length}\n📌 Status: ${data.status}`,
        threadID
      );
      break;
    }

    case "join": {
      const ID = args[1]?.replace("#", "");
      if (!ID) return api.sendMessage("📌 Please provide a GiveAway ID.", threadID, messageID);

      const data = global.data.GiveAway.get(ID);
      if (!data) return api.sendMessage("❗Giveaway not found.", threadID, messageID);
      if (data.joined.includes(senderID)) return api.sendMessage("✅ You have already joined this giveaway.", threadID, messageID);

      data.joined.push(senderID);
      global.data.GiveAway.set(ID, data);

      const threadInfo = await api.getThreadInfo(threadID);
      const name = threadInfo.nicknames?.[senderID] || (await Users.getInfo(senderID)).name;
      api.sendMessage(`${name} successfully joined the giveaway (ID: #${ID})`, threadID);
      break;
    }

    case "roll": {
      const ID = args[1]?.replace("#", "");
      if (!ID) return api.sendMessage("📌 Provide a GiveAway ID to roll a winner.", threadID, messageID);

      const data = global.data.GiveAway.get(ID);
      if (!data) return api.sendMessage("❗Giveaway not found.", threadID, messageID);
      if (data.authorID !== senderID) return api.sendMessage("⛔ You're not the giveaway host.", threadID, messageID);
      if (data.joined.length === 0) return api.sendMessage("⚠️ No participants to choose from.", threadID, messageID);

      const winnerID = data.joined[Math.floor(Math.random() * data.joined.length)];
      const winnerInfo = await Users.getInfo(winnerID);

      api.sendMessage({
        body: `🎉 CONGRATS ${winnerInfo.name}!\n🎁 You won: ${data.reward}\n📨 Contact the host: ${data.author} (fb.me/${data.authorID})`,
        mentions: [{ tag: winnerInfo.name, id: winnerID }]
      }, threadID);
      break;
    }

    case "end": {
      const ID = args[1]?.replace("#", "");
      if (!ID) return api.sendMessage("📌 Provide a GiveAway ID to end.", threadID, messageID);

      const data = global.data.GiveAway.get(ID);
      if (!data) return api.sendMessage("❗Giveaway not found.", threadID, messageID);
      if (data.authorID !== senderID) return api.sendMessage("⛔ You're not the giveaway host.", threadID, messageID);

      data.status = "ended";
      global.data.GiveAway.set(ID, data);
      api.unsendMessage(data.messageID);
      api.sendMessage(`✅ Giveaway #${ID} has been ended.`, threadID);
      break;
    }

    default:
      return api.sendMessage("❓ Invalid subcommand. Use: create | details | join | roll | end", threadID, messageID);
  }
};
