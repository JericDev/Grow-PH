const axios = require("axios");
const fs = require("fs-extra");

module.exports.config = {
  name: "stock",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Jeric x ChatGPT",
  description: "Sends the latest stock screenshot from the Grow A Garden site",
  commandCategory: "utility",
  usages: "",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const apiKey = "655df2da-1084-49be-8f1b-a672bb3548c5";
  const url = `https://api.meewmeew.xyz/tools/screenshot?url=https://vulcanvalues.com/grow-a-garden/stock&fullpage=false&apikey=${apiKey}`;

  try {
    const path = __dirname + `/cache/stock.png`;
    const response = await axios.get(url, { responseType: "stream" });

    const writer = fs.createWriteStream(path);
    response.data.pipe(writer);
    writer.on("finish", () => {
      api.sendMessage(
        {
          body: "🪴 Here's the latest Grow A Garden stock page:",
          attachment: fs.createReadStream(path)
        },
        event.threadID,
        () => fs.unlinkSync(path),
        event.messageID
      );
    });

    writer.on("error", (err) => {
      console.error(err);
      return api.sendMessage("❌ Error saving screenshot.", event.threadID, event.messageID);
    });
  } catch (err) {
    console.error(err);
    return api.sendMessage("❌ Failed to fetch screenshot. Check the API or site status.", event.threadID, event.messageID);
  }
};

