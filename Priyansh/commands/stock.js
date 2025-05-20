const axios = require("axios");
const fs = require("fs");
const request = require("request");

module.exports.config = {
  name: "stock",
  version: "1.0.0",
  credits: "ChatGPT",
  description: "Sends a screenshot of stock page",
  hasPermssion: 0,
  commandCategory: "utility",
  cooldowns: 10,
  usePrefix: true
};

module.exports.run = async function ({ api, event }) {
  try {
    const screenshotUrl = `https://image.thum.io/get/width/800/crop/600/noanimate/https://vulcanvalues.com/grow-a-garden/stock`;
    const path = __dirname + "/cache/stock.jpg";

    const file = fs.createWriteStream(path);
    request(screenshotUrl)
      .pipe(file)
      .on("finish", () => {
        api.sendMessage({
          body: "🧾 Latest Stock Page",
          attachment: fs.createReadStream(path)
        }, event.threadID, () => fs.unlinkSync(path), event.messageID);
      })
      .on("error", (err) => {
        console.error(err);
        api.sendMessage("❌ Error loading screenshot.", event.threadID, event.messageID);
      });

  } catch (e) {
    console.error(e);
    api.sendMessage("❌ Failed to load stock screenshot.", event.threadID, event.messageID);
  }
};
