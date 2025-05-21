module.exports.config = {
    name: "rules",
    version: "1.0.0",
    hasPermission: 0,
    credits: "Zia_Rein",
    description: "important notes",
    commandCategory: "guide",
    usages: "send message",
    cooldowns: 5,
    dependencies: {
        "request": "",
        "fs-extra": "",
        "axios": ""
    }
};

module.exports.run = async ({ api, event, args }) => {
    const axios = global.nodemodule["axios"];
    const request = global.nodemodule["request"];
    const fs = global.nodemodule["fs-extra"];

    const rulesText = `𝙂𝘼𝙂 𝙏𝘼𝙈𝘽𝘼𝙔𝘼𝙉 𝙍𝙐𝙇𝙀𝙎🌶️
⚠️ Respect the Admins.
⚠️ Respect all Members.
⚠️ Always use Midman/Middlewoman.
⚠️ Be friendly and avoid toxic behavior.
⚠️ Sending Links is not allowed.
⚠️ Spamming is not allowed.
⚠️ GAG Related only.
⚠️ No Promoting links other gc/groups.

Failure to follow the rules may result in a warning, kick or ban.!`;

    const imageURLs = [
        "https://i.imgur.com/huumLca.jpg",
        "https://i.imgur.com/EcryTGh.jpg",
        "https://i.imgur.com/tu12HrQ.jpg",
        "https://i.imgur.com/Vx25FHG.jpg",
        "https://i.imgur.com/NcbC8Pn.jpg",
    ];

    const randomImageURL = imageURLs[Math.floor(Math.random() * imageURLs.length)];
    const cachePath = __dirname + "/cache/ZiaRein1.jpg";

    // Function to send the message after downloading the image
    const sendRulesMessage = () => {
        api.sendMessage({
            body: rulesText,
            attachment: fs.createReadStream(cachePath)
        }, event.threadID, () => {
            // Delete cached image after sending
            fs.unlinkSync(cachePath);
        }, event.messageID);
    };

    try {
        // Download image and save to cache
        await new Promise((resolve, reject) => {
            request(encodeURI(randomImageURL))
                .pipe(fs.createWriteStream(cachePath))
                .on("close", resolve)
                .on("error", reject);
        });

        sendRulesMessage();
    } catch (error) {
        console.error("❌ Failed to send rules:", error);
        return api.sendMessage("❌ Failed to load or send the rules. Try again later.", event.threadID, event.messageID);
    }
};
