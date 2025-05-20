const axios = require("axios");
const fs = require("fs");
const request = require("request");

module.exports.config = {
  name: "shoti",
  version: "1.0.0",
  credits: "Kaiz API - fixed by ChatGPT",
  description: "Generate random TikTok girl videos",
  hasPermssion: 0,
  commandCategory: "media",
  usages: "[shoti]",
  cooldowns: 20,
  usePrefix: true
};

module.exports.run = async function ({ api, event }) {
  try {
    const apiUrl = "https://kaiz-apis.gleeze.com/api/shoti?apikey=655df2da-1084-49be-8f1b-a672bb3548c5";
    const { data } = await axios.get(apiUrl);

    if (!data || !data.data || !data.data.url) {
      return api.sendMessage("❌ Failed to fetch video.", event.threadID, event.messageID);
    }

    const videoUrl = data.data.url;
    const username = data.data.user?.username || "Unknown";
    const path = __dirname + "/cache/shoti.mp4";

    const file = fs.createWriteStream(path);
    request(videoUrl)
      .pipe(file)
      .on("finish", () => {
        api.sendMessage(
          {
            body: `🎥 TikTok by @${username}`,
            attachment: fs.createReadStream(path)
          },
          event.threadID,
          () => fs.unlinkSync(path),
          event.messageID
        );
      })
      .on("error", (err) => {
        api.sendMessage("❌ Error downloading video.", event.threadID, event.messageID);
      });
  } catch (error) {
    console.error(error);
    return api.sendMessage("❌ An error occurred.", event.threadID, event.messageID);
  }
};
