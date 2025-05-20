const axios = require("axios");

module.exports.config = {
  name: "tikstalk",
  version: "1.0.0",
  credits: "ChatGPT",
  description: "Get TikTok user profile info",
  hasPermssion: 0,
  commandCategory: "utility",
  usage: "[username]",
  cooldowns: 10,
  usePrefix: true,
};

module.exports.run = async function ({ api, event, args }) {
  const username = args[0];

  if (!username) {
    return api.sendMessage("❌ Please provide a TikTok username.\nExample: -tikstalk jeric_luci", event.threadID, event.messageID);
  }

  try {
    const url = `https://kaiz-apis.gleeze.com/api/tiktok/stalk?username=${encodeURIComponent(username)}&apikey=655df2da-1084-49be-8f1b-a672bb3548c5`;
    const { data } = await axios.get(url);

    if (!data || data.status === false || !data.username) {
      return api.sendMessage("❌ Could not fetch TikTok profile. Make sure the username is correct.", event.threadID, event.messageID);
    }

    const message = `
📱 TikTok Profile Info:
👤 Name: ${data.username}
🔖 Nickname: ${data.nickname}
📝 Bio: ${data.signature || "No bio"}
📹 Videos: ${data.videoCount}
👥 Followers: ${data.followerCount}
👣 Following: ${data.followingCount}
❤️ Likes: ${data.heartCount}
🔗 Profile Link: https://www.tiktok.com/@${data.nickname}
    `.trim();

    const axiosRes = await axios.get(data.avatarLarger, { responseType: "stream" });

    return api.sendMessage(
      {
        body: message,
        attachment: axiosRes.data,
      },
      event.threadID,
      event.messageID
    );

  } catch (error) {
    console.error(error);
    return api.sendMessage("❌ Error fetching TikTok profile.", event.threadID, event.messageID);
  }
};
