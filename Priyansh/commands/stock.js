const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

module.exports.config = {
  name: "stock",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Priyansh + ChatGPT",
  description: "Show real-time Grow-A-Garden stock",
  commandCategory: "utility",
  usages: "stock",
  cooldowns: 10
};

module.exports.run = async ({ api, event }) => {
  const filePath = path.join(__dirname, 'stock.png');

  api.sendMessage("🔍 Getting real-time stock info. Please wait...", event.threadID, async () => {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.goto("https://vulcanvalues.com/grow-a-garden/stock", { waitUntil: "networkidle2" });

      // Hide the cookie popup if visible
      await page.evaluate(() => {
        const cookiePopup = document.querySelector(".CookieConsent");
        if (cookiePopup) cookiePopup.style.display = 'none';
      });

      const stockSection = await page.$("body");
      await stockSection.screenshot({ path: filePath });

      await browser.close();

      api.sendMessage({
        body: "🌿 Here's the current Grow-A-Garden stock:",
        attachment: fs.createReadStream(filePath)
      }, event.threadID, () => fs.unlinkSync(filePath));
    } catch (err) {
      console.error("Stock command error:", err);
      api.sendMessage("❌ Couldn't fetch stock data.", event.threadID);
    }
  });
};
