module.exports.config = {
  name: "sipa",
  version: "1.0.3",
  hasPermssion: 2,
  credits: "𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭 (fixed by ChatGPT)",
  description: "sipa a user by mention or UID with reason; logs sent to GOD admins",
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
    "missingUser": "Kailangan mong i-tag o ilagay ang UID ng taong gusto mong sipain",
    "missingReason": "Kailangan mong ilagay ang dahilan kung bakit mo sisipain",
    "notAdminBot": "Only Bot Admins can use this command",
    "cannotKickOwner": "❌ bawal sipain ang Group Owner.",
    "cannotKickGOD": "❌ bawal sipain ang GOD Admin.",
    "kicked": "Sipa {name} from the group\nReason: {reason}"
  }
}

module.exports.run = async function({ api, event, args, getText, Threads, Users }) {
  const senderID = event.senderID;
  const threadID = event.threadID;

  try {
    if (!global.config.ADMINBOT.includes(senderID)) {
      return api.sendMessage(getText("notAdminBot"), threadID, event.messageID);
    }

    const threadData = await Threads.getData(threadID);
    const dataThread = threadData.threadInfo;
    const botID = api.getCurrentUserID();

    if (!dataThread.adminIDs.some(item => item.id == botID)) {
      return api.sendMessage(getText("needPermssion"), threadID, event.messageID);
    }

    const mentionIDs = Object.keys(event.mentions);
    let targetID;

    if (mentionIDs.length > 0) {
      targetID = mentionIDs[0];
      const fullName = event.mentions[targetID];
      const nameWords = fullName.trim().split(/\s+/);
      args.splice(0, nameWords.length); // Remove all words of the mention name
    } else if (args[0]) {
      targetID = args[0];
      args.shift(); // Remove UID from args
    } else {
      return api.sendMessage(getText("missingUser"), threadID, event.messageID);
    }

    if (targetID === dataThread.ownerID) {
      return api.sendMessage(getText("cannotKickOwner"), threadID, event.messageID);
    }

    if (global.config.GOD.includes(targetID)) {
      return api.sendMessage(getText("cannotKickGOD"), threadID, event.messageID);
    }

    const targetInfo = await Users.getInfo(targetID);
    const targetName = targetInfo.name || targetID;

    let reason = args.join(" ").trim();
    if (!reason) return api.sendMessage(getText("missingReason"), threadID, event.messageID);

    // Kick the user
    await api.removeUserFromGroup(targetID, threadID);

    const senderInfo = await Users.getInfo(senderID);
    const senderName = senderInfo.name || senderID;

    // Confirmation to group
    api.sendMessage(
      getText("sipa").replace("{name}", targetName).replace("{reason}", reason),
      threadID
    );

    // Log to GODs
    const groupName = dataThread.threadName || "Unknown";
    const logMessage =
      `🚨 User kicked 🚨\n` +
      `👤 Kicked user: ${targetName} (${targetID})\n` +
      `👮 Kicked by: ${senderName} (${senderID})\n` +
      `🧾 Reason: ${reason}\n` +
      `💬 Group: ${groupName} (${threadID})`;

    const logRecipients = global.config.GOD || [];
    for (const uid of logRecipients) {
      api.sendMessage(logMessage, uid);
    }

  } catch (error) {
    console.error(error);
    return api.sendMessage(getText("error"), threadID, event.messageID);
  }
};
