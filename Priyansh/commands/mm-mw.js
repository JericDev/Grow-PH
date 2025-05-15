module.exports.config = {
  name: "mm/mw",
  version: "1.1.0",
  hasPermission: 0,
  credits: "OpenAI",
  description: "Create a group chat with you and multiple mentioned users or UIDs",
  commandCategory: "utility",
  usages: "<@mention or UID> [<@mention or UID> ...]",
  cooldowns: 5,
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, senderID, mentions, messageID } = event;

  // Collect unique user IDs from mentions or args (if numeric)
  let userIDs = [];

  // Add mentioned users first
  if (Object.keys(mentions).length > 0) {
    userIDs = [...new Set(Object.keys(mentions))];
  }

  // Also add any numeric args that are not in mentions
  for (const arg of args) {
    if (!isNaN(arg) && !userIDs.includes(arg) && arg !== senderID) {
      userIDs.push(arg);
    }
  }

  if (userIDs.length === 0) {
    return api.sendMessage("❗ Please mention at least one user or provide at least one valid user ID.", threadID, messageID);
  }

  // Include the sender in the group
  if (!userIDs.includes(senderID)) userIDs.unshift(senderID);

  try {
    // Fetch names for group naming (first 2 users only for brevity)
    const userInfo = await api.getUserInfo(userIDs.slice(0, 2));
    const name1 = userInfo[userIDs[0]]?.name || "User 1";
    const name2 = userInfo[userIDs[1]]?.name || "User 2";

    const groupName = `Chat: ${name1} & ${name2}` + (userIDs.length > 2 ? ` & +${userIDs.length - 2} more` : "");

    // Create the group with all users
    const newGroupID = await api.createNewGroup(userIDs, groupName);
    if (!newGroupID) throw new Error("Failed to create group");

    return api.sendMessage(`✅ Group created successfully: ${groupName}`, newGroupID);
  } catch (err) {
    console.error(err);
    return api.sendMessage("❌ Failed to create group chat. Make sure the UIDs are correct and all users can be added.", threadID, messageID);
  }
};
