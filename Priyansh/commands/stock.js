module.exports.config = {
    name: "stock",
    version: "1.0.0",
    hasPermission: 0,
    credits: "ChatGPT",
    description: "Shows stock of seeds, gears, and eggs",
    commandCategory: "random-img",
    usages: "stock",
    cooldowns: 5,
    dependencies: {
        "axios": ""
    }
};

module.exports.run = async ({ api, event }) => {
    const axios = global.nodemodule["axios"];

    try {
        const res = await axios.get('https://vulcanvalues.com/grow-a-garden/stock');
        const stockData = res.data;

        if (!stockData.stock || !Array.isArray(stockData.stock)) {
            return api.sendMessage("Failed to retrieve valid stock data.", event.threadID, event.messageID);
        }

        // Filter only seeds, gears, and eggs
        const filteredItems = stockData.stock.filter(item =>
            ["seeds", "gears", "eggs"].includes(item.item.toLowerCase())
        );

        if (filteredItems.length === 0) {
            return api.sendMessage("No seeds, gears, or eggs stock info found.", event.threadID, event.messageID);
        }

        // Format the message
        let message = '🌱 Stock Info (Seeds, Gears, Eggs):\n';
        filteredItems.forEach(item => {
            message += `• ${item.item}: ${item.amount}\n`;
        });

        return api.sendMessage(message, event.threadID, event.messageID);

    } catch (error) {
        return api.sendMessage(`Error fetching stock data: ${error.message}`, event.threadID, event.messageID);
    }
};
