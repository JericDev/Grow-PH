const axios = require('axios');
const cheerio = require('cheerio');

module.exports.config = {
  name: "stock",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "YourName",
  description: "Fetch and show Grow A Garden stock from VulcanValues",
  commandCategory: "Utility",
  usages: "stock",
  cooldowns: 3,
};

module.exports.run = async function({ api, event }) {
  try {
    const response = await axios.get('https://vulcanvalues.com/grow-a-garden/stock');
    const html = response.data;
    const $ = cheerio.load(html);

    let stockMessage = "📦 **Grow A Garden Stock:**\n\n";

    // Example: Extract Gear Stock
    stockMessage += "**Gear Stock:**\n";
    $('h2:contains("GEAR STOCK")').nextUntil('h2').each((i, elem) => {
      const item = $(elem).text().trim();
      if (item) stockMessage += `- ${item}\n`;
    });

    // Example: Extract Egg Stock
    stockMessage += "\n**Egg Stock:**\n";
    $('h2:contains("EGG STOCK")').nextUntil('h2').each((i, elem) => {
      const item = $(elem).text().trim();
      if (item) stockMessage += `- ${item}\n`;
    });

    // Example: Extract Seeds Stock
    stockMessage += "\n**Seeds Stock:**\n";
    $('h2:contains("SEEDS STOCK")').nextUntil('h2').each((i, elem) => {
      const item = $(elem).text().trim();
      if (item) stockMessage += `- ${item}\n`;
    });

    api.sendMessage(stockMessage, event.threadID, event.messageID);
  } catch (error) {
    console.error(error);
    api.sendMessage("❌ Failed to fetch stock data. Please try again later.", event.threadID, event.messageID);
  }
};
