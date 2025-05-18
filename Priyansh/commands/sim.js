module.exports.config = {
    name: "sim",
    version: "4.3.7",
    hasPermssion: 0,
    credits: "Updated by ChatGPT",
    description: "Chat with Simsimi AI via simsimi.ooguy.com",
    commandCategory: "Chat AI",
    usages: "[message]",
    cooldowns: 5,
    dependencies: {
        axios: ""
    },
    envConfig: {
        APIKEY: "746a1518bc8043bfba43eaa1a3ac4d69d4a77982"
    }
};

async function simsimi(input) {
    const axios = require("axios");
    const { APIKEY } = global.configModule.sim;
    const encoded = encodeURIComponent(input);
    
    try {
        const { data } = await axios.get(`https://simsimi.ooguy.com/sim`, {
            params: {
                query: input,
                apikey: APIKEY
            }
        });
        return { error: false, answer: data.answer };
    } catch (err) {
        return {
            error: true,
            message: err.response?.data?.error || "An error occurred while contacting the API."
        };
    }
}

module.exports.onLoad = async function () {
    if (!global.manhG) global.manhG = {};
    if (!global.manhG.simsimi) global.manhG.simsimi = new Map();
};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body } = event;
    if (!body || senderID == api.getCurrentUserID()) return;

    if (global.manhG.simsimi.has(threadID)) {
        const { error, answer, message } = await simsimi(body);
        if (error) return api.sendMessage(`[SIM ERROR] ${message}`, threadID, messageID);
        return api.sendMessage(answer, threadID, messageID);
    }
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const input = args.join(" ");

    if (!args[0]) {
        return api.sendMessage("🟡 You need to enter a message. Example:\nsim hello", threadID, messageID);
    }

    if (args[0].toLowerCase() === "on") {
        if (global.manhG.simsimi.has(threadID)) {
            return api.sendMessage("✅ Simsimi is already active in this thread.", threadID, messageID);
        }
        global.manhG.simsimi.set(threadID, messageID);
        return api.sendMessage("✅ Simsimi is now active in this thread.", threadID, messageID);
    }

    if (args[0].toLowerCase() === "off") {
        if (!global.manhG.simsimi.has(threadID)) {
            return api.sendMessage("⚠️ Simsimi is not active in this thread.", threadID, messageID);
        }
        global.manhG.simsimi.delete(threadID);
        return api.sendMessage("🛑 Simsimi has been deactivated for this thread.", threadID, messageID);
    }

    const { error, answer, message } = await simsimi(input);
    if (error) return api.sendMessage(`[SIM ERROR] ${message}`, threadID, messageID);
    return api.sendMessage(answer, threadID, messageID);
};

