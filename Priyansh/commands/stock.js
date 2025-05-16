const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

module.exports.config = {
  name: "stock",
  version: "1.0.1",
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

      // Set viewport for proper layout
      await page.setViewport({ width: 1200, height: 800 });

      // Hide cookie consent popup if it exists
      await page.evaluate(() => {
        const cookie = document.querySelector('.CookieConsent');
        if (cookie) cookie.style.display = 'none';
      });

      // Wait for the stock section to load
      await page.waitForSelector('.chakra-stack.css-1h4wxzf');

      // Get the bounding box of the stock container
      const stockSection = await page.$('main');
      if (!stockSection) throw new Error("Stock section not found!");

      // Take screenshot of stock section
      await stockSection.screenshot({ path: filePath });

      await browser.close();

      // Send the screenshot
      api.sendMessage({
        body: "🌿 Here's the current Grow-A-Garden stock:",
        attachment: fs.createReadStream(filePath)
      }, event.threadID, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });

    } catch (err) {
      console.error("❌ Error fetching stock:", err);
      api.sendMessage("❌ Couldn't fetch stock data. Try again later.", event.threadID);
    }
  });
};
