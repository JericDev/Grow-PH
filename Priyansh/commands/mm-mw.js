module.exports.config = {
  name: "mm",
  version: "1.1.1",
  hasPermission: 2,  // Admin only
  credits: "OpenAI",
  description: "Create a group chat with you and multiple mentioned users or UIDs (Admins only)",
  commandCategory: "admin",
  usages: "<@mention or UID> [<@mention or UID> ...]",
  cooldowns: 5,
  aliases: ["mw"]
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, senderID, mentions, messageID } = event;

  // Check if sender is admin in the thread
  const threadInfo = await api.getThreadInfo(threadID);
  const isAdmin = threadInfo.adminIDs.some(ad => ad.id == senderID);
  if (!isAdmin) {
    return api.sendMessage("❌ Only admins can use this command.", threadID, messageID);
  }

  // Collect unique user IDs from mentions or args (if numeric)
  let userIDs = [];

  if (Object.keys(mentions).length > 0) {
    userIDs = [...new Set(Object.keys(mentions))];
  }

  for (const arg of args) {
    if (!isNaN(arg) && !userIDs.includes(arg) && arg !== senderID) {
      userIDs.push(arg);
    }
  }

  if (userIDs.length === 0) {
    return api.sendMessage("❗ Please mention at least one user or provide at least one valid user ID.", threadID, messageID);
  }

  if (!userIDs.includes(senderID)) userIDs.unshift(senderID);

  try {
    const userInfo = await api.getUserInfo(userIDs.slice(0, 2));
    const name1 = userInfo[userIDs[0]]?.name || "User 1";
    const name2 = userInfo[userIDs[1]]?.name || "User 2";

    const groupName = `Chat: ${name1} & ${name2}` + (userIDs.length > 2 ? ` & +${userIDs.length - 2} more` : "");

    const newGroupID = await api.createNewGroup(userIDs, groupName);
    if (!newGroupID) throw new Error("Failed to create group");

    return api.sendMessage(`✅ Group created successfully: ${groupName}`, newGroupID);
  } catch (err) {
    console.error(err);
    return api.sendMessage("❌ Failed to create group chat. Make sure the UIDs are correct and all users can be added.", threadID, messageID);
  }
};
