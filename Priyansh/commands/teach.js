module.exports.config = {
    name: "teach",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Updated by ChatGPT",
    description: "Teach Simimi using ooguy.com API",
    commandCategory: "Sim",
    usages: "",
    cooldowns: 2,
    dependencies: {
        "axios": ""
    }
};

const API_KEY = "746a1518bc8043bfba43eaa1a3ac4d69d4a77982";

module.exports.run = ({ api, event, args }) => {
    const { threadID, messageID, senderID } = event;
    return api.sendMessage("[ 𝐒𝐈𝐌 ] - Reply to this message with the **question** you want to teach.", threadID, (err, info) => {
        global.client.handleReply.push({
            step: 1,
            name: this.config.name,
            messageID: info.messageID,
            content: {
                id: senderID,
                ask: "",
                ans: ""
            }
        });
    }, messageID);
};

module.exports.handleReply = async ({ api, event, Users, handleReply }) => {
    const axios = require("axios");
    const moment = require("moment-timezone");
    const timeZ = moment.tz("Asia/Kolkata").format("HH:mm:ss | DD/MM/YYYY");
    const { threadID, messageID, senderID, body } = event;

    if (handleReply.content.id !== senderID) return;

    const input = body.trim();
    const sendC = (msg, step, content) => api.sendMessage(msg, threadID, (err, info) => {
        global.client.handleReply.splice(global.client.handleReply.indexOf(handleReply), 1);
        api.unsendMessage(handleReply.messageID);
        global.client.handleReply.push({
            step,
            name: module.exports.config.name,
            messageID: info.messageID,
            content
        });
    }, messageID);

    const send = async (msg) => api.sendMessage(msg, threadID, messageID);

    let content = handleReply.content;

    switch (handleReply.step) {
        case 1:
            content.ask = input;
            sendC("[ 𝐒𝐈𝐌 ] - Great! Now reply with the **answer** you want Simmi to learn.", 2, content);
            break;

        case 2:
            content.ans = input;
            global.client.handleReply.splice(global.client.handleReply.indexOf(handleReply), 1);
            api.unsendMessage(handleReply.messageID);

            const c = content;

            try {
                const res = await axios.get(`https://simsimi.ooguy.com/teach`, {
                    params: {
                        ask: c.ask,
                        ans: c.ans,
                        apikey: API_KEY
                    }
                });

                if (res.data?.error) return send(`[❌] Error: ${res.data.error}`);
                
                return send(`[ ✅ TEACH SUCCESS ]\n\n🧠 Learned:\n"${c.ask}" → "${c.ans}"\n🕒 Time: ${timeZ}`);
            } catch (err) {
                return send(`[❌] Failed to teach Simmi:\n${err.response?.data?.error || err.message}`);
            }

        default:
            break;
    }
};
