module.exports.config = {
  name: "mm-mw",
  version: "1.0.0",
  hasPermssion: 0,  // anyone can use
  credits: "YourName",
  description: "Notify all bot admins that a user used this command",
  commandCategory: "Info",
  usages: "",
  cooldowns: 5
};

module.exports.run = async function({ api, event, Users }) {
  const { senderID, threadID, messageID } = event;
  const adminIDs = global.config.ADMINBOT || [];

  if (adminIDs.length === 0) {
    return api.sendMessage("No admins found to notify.", threadID, messageID);
  }

  const userName = await Users.getNameUser(senderID);

  // Prepare the message for admins
  const msgToAdmins = `[⚠️] User ${userName} (https://facebook.com/${senderID}) used the midman command.\nThread ID: ${threadID}`;

  // Send a private message to each admin
  for (const adminID of adminIDs) {
    const adminName = await Users.getNameUser(adminID);
    api.sendMessage(`Hello ${adminName},\n\n${msgToAdmins}`, adminID);
  }

  // Confirm to the user
  return api.sendMessage("Your message has been sent to the admins.", threadID, messageID);
};

