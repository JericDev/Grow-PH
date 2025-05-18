const axios = require("axios");

module.exports.config = {
    name: "teach",
    version: "1.0",
    hasPermission: 0,
    credits: "Deku (API version by ChatGPT)",
    usePrefix: false,
    description: "Teach Sim responses using an external API",
    usages: "<ask> - <answer>",
    commandCategory: "fun",
    cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID } = event;

    const input = args.join(" ").split("-").map(item => item.trim());
    const ask = input[0];
    const ans = input[1];

    if (!ask || !ans) {
        return api.sendMessage(
            `❌ Invalid format!\nUse: ${global.config.prefix}${this.config.name} <ask> - <answer>`,
            threadID,
            messageID
        );
    }

    const apiUrl = `https://wrapped-rest-apis.vercel.app/api/teach?ask=${encodeURIComponent(ask)}&ans=${encodeURIComponent(ans)}`;

    try {
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (data.status !== "success") {
            return api.sendMessage(`❌ API Error: ${data.message || "Unknown error"}`, threadID, messageID);
        }

        return api.sendMessage(
            `✅ Successfully taught Sim!\n\n📌 Ask: ${ask}\n💬 Answer: ${ans}`,
            threadID,
            messageID
        );
    } catch (error) {
        console.error("API error:", error);
        return api.sendMessage("❌ Failed to teach Sim. Please try again later.", threadID, messageID);
    }
};
