module.exports.config = {
  name: "kick",
  version: "1.0.3",
  hasPermssion: 2, // Admin only by default, but actual check below
  credits: "𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭 (fixed by ChatGPT)",
  description: "Kick a user by mention or UID with reason; logs sent to GOD admins",
  commandCategory: "System",
  usages: "<mention or uid> <reason>",
  cooldowns: 0,
};

module.exports.languages = {
  "vi": {
    "error": "Đã có lỗi xảy ra, vui lòng thử lại sau",
    "needPermssion": "Cần quyền quản trị viên nhóm\nVui lòng thêm và thử lại!",
    "missingUser": "Bạn phải tag hoặc nhập UID người cần kick",
    "missingReason": "Bạn phải nhập lý do kick",
    "notAdminBot": "Chỉ Admin Bot mới có thể sử dụng lệnh này",
    "cannotKickOwner": "❌ Không thể kick chủ nhóm.",
    "cannotKickGOD": "❌ Không thể kick GOD Admin.",
    "kicked": "Đã kick {name} khỏi nhóm\nLý do: {reason}"
  },
  "en": {
    "error": "Error! An error occurred. Please try again later!",
    "needPermssion": "Need group admin permission\nPlease add and try again!",
    "missingUser": "You need to tag or enter the UID of the person to kick",
    "missingReason": "You need to enter the reason for kicking",
    "notAdminBot": "Only Bot Admins can use this command",
    "cannotKickOwner": "❌ Cannot kick the Group Owner.",
    "cannotKickGOD": "❌ Cannot kick a GOD Admin.",
    "kicked": "Kicked {name} from the group\nReason: {reason}"
  }
}

module.exports.run = async function({ api, event, args, getText, Threads, Users }) {
  const senderID = event.senderID;
  const threadID = event.threadID;

  try {
    // Only allow Bot Admins to run this command
    if (!global.config.ADMINBOT.includes(senderID)) {
      return api.sendMessage(getText("notAdminBot"), threadID, event.messageID);
    }

    // Get thread info to check if bot is admin in this group
    const dataThread = (await Threads.getData(threadID)).threadInfo;
    const botID = api.getCurrentUserID();

    if (!dataThread.adminIDs.some(item => item.id == botID)) {
      return api.sendMessage(getText("needPermssion"), threadID, event.messageID);
    }

    // Extract target user from mention or UID argument
    const mentionIDs = Object.keys(event.mentions);
    let targetID;

    if (mentionIDs.length > 0) {
      targetID = mentionIDs[0];
      args.shift(); // Remove mention from args to isolate reason
    } else if (args[0]) {
      targetID = args[0];
      args.shift(); // Remove UID from args
    } else {
      return api.sendMessage(getText("missingUser"), threadID, event.messageID);
    }

    // Prevent kicking the group owner
    if (targetID === dataThread.ownerID) {
      return api.sendMessage(getText("cannotKickOwner"), threadID, event.messageID);
    }

    // Prevent kicking any GOD admins
    if (global.config.GOD.includes(targetID)) {
      return api.sendMessage(getText("cannotKickGOD"), threadID, event.messageID);
    }

    // Get reason string
    const reason = args.join(" ");
    if (!reason) return api.sendMessage(getText("missingReason"), threadID, event.messageID);

    // Kick user from group
    await api.removeUserFromGroup(targetID, threadID);

    // Get user names for logs and confirmation
    const targetInfo = await Users.getInfo(targetID);
    const targetName = targetInfo.name || targetID;

    const senderInfo = await Users.getInfo(senderID);
    const senderName = senderInfo.name || senderID;

    // Send confirmation message to group
    api.sendMessage(
      getText("kicked").replace("{name}", targetName).replace("{reason}", reason),
      threadID
    );

    // Prepare log message for admins
    const logMessage = 
      `🚨 User kicked 🚨\n` +
      `👤 Kicked user: ${targetName} (${targetID})\n` +
      `👮 Kicked by: ${senderName} (${senderID})\n` +
      `🧾 Reason: ${reason}\n` +
      `💬 Group: ${event.threadName || "unknown"} (${threadID})`;

    // Send logs to all GOD admins
    const logRecipients = global.config.GOD || [];
    for (const uid of logRecipients) {
      api.sendMessage(logMessage, uid);
    }

  } catch (error) {
    console.error(error);
    return api.sendMessage(getText("error"), threadID, event.messageID);
  }
};
