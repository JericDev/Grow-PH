const axios = require("axios");

module.exports.config = {
  name: "tilkstalk",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "Jeric x ChatGPT",
  description: "Fetch TikTok profile details",
  commandCategory: "info",
  usages: "[username]",
  cooldowns: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const username = args.join(" ");
  if (!username)
    return api.sendMessage("❌ Please provide a TikTok username.", event.threadID, event.messageID);

  try {
    const res = await axios.get(`https://api.meewmeew.xyz/tiktok/stalk`, {
      params: {
        username: username,
        apikey: "655df2da-1084-49be-8f1b-a672bb3548c5"
      }
    });

    const data = res.data;
    const {
      author,
      nickname,
      username: uname,
      signature,
      videoCount,
      followingCount,
      followerCount,
      heartCount,
      avatarLarger
    } = data;

    const msg = `👤 𝗧𝗶𝗸𝗧𝗼𝗸 𝗦𝘁𝗮𝗹𝗸 𝗥𝗲𝘀𝘂𝗹𝘁:
━━━━━━━━━━━━━━━
📛 Name: ${nickname}
👤 Username: ${uname}
📝 Bio: ${signature}
📹 Videos: ${videoCount}
👥 Following: ${followingCount}
👣 Followers: ${followerCount}
❤️ Hearts: ${heartCount}
🔗 Profile by: ${author}
━━━━━━━━━━━━━━━`;

    // Send avatar image + message
    const img = (await axios.get(avatarLarger, { responseType: "stream" })).data;
    return api.sendMessage(
      {
        body: msg,
        attachment: img
      },
      event.threadID,
      event.messageID
    );
  } catch (e) {
    console.error(e);
    return api.sendMessage("❌ Failed to fetch TikTok profile. Make sure the username is correct.", event.threadID, event.messageID);
  }
};
