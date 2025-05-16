const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

module.exports.config = {
  name: "stock",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "YourName",
  description: "Show real-time stock from Grow-A-Garden",
  commandCategory: "tools",
  usages: "",
  cooldowns: 10
};

module.exports.run = async ({ api, event }) => {
  const filePath = path.join(__dirname, 'stock.png');

  api.sendMessage("📸 Fetching real-time stock data, please wait...", event.threadID, async () => {
    try {
      const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
      const page = await browser.newPage();
      await page.goto("https://vulcanvalues.com/grow-a-garden/stock", { waitUntil: "networkidle2" });

      // Optionally hide cookie popup
      await page.evaluate(() => {
        const cookiePopup = document.querySelector(".CookieConsent");
        if (cookiePopup) cookiePopup.style.display = 'none';
      });

      // Take screenshot
      const stockSection = await page.$("body");
      await stockSection.screenshot({ path: filePath });

      await browser.close();

      api.sendMessage({
        body: "🌱 Grow-A-Garden Live Stock:",
        attachment: fs.createReadStream(filePath)
      }, event.threadID, () => fs.unlinkSync(filePath)); // Delete after sending
    } catch (error) {
      console.error(error);
      api.sendMessage("❌ Failed to fetch stock data.", event.threadID);
    }
  });
};

