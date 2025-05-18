const axios = require("axios");

module.exports.config = {
    name: "sim",
    version: "1.0.1",
    hasPermssion: 0,
    credits: "KENLIEPLAYS & Updated by ChatGPT",
    description: "Talk to Sim using a new API endpoint",
    commandCategory: "fun",
    usages: "[your message]",
    cooldowns: 2,
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID } = event;

    if (!args[0]) {
        return api.sendMessage("Please type a message to talk to Sim.", threadID, messageID);
    }

    const message = encodeURIComponent(args.join(" "));
    const url = `https://wrapped-rest-apis.vercel.app/api/sim?query=${message}`;

    try {
        const response = await axios.get(url);
        const data = response.data;

        if (data.status !== "success") {
            return api.sendMessage("❌ Error: Unable to get a valid response from Sim API.", threadID, messageID);
        }

        api.sendMessage(data.response, threadID, messageID);
    } catch (error) {
        console.error("Sim API Error:", error);
        api.sendMessage("❌ An error occurred while trying to contact Sim.", threadID, messageID);
    }
};
