module.exports.config = {
    name: "joinNoti",
    eventType: ["log:subscribe"],
    version: "1.0.1",
    credits: "𝙋𝙧𝙞𝙮𝙖𝙣𝙨𝙝 𝙍𝙖𝙟𝙥𝙪𝙩",
    description: "Notification of bots or people entering groups with random gif/photo/video",
    dependencies: {
        "fs-extra": "",
        "path": "",
        "pidusage": ""
    }
};
 
module.exports.onLoad = function () {
    const { existsSync, mkdirSync } = global.nodemodule["fs-extra"];
    const { join } = global.nodemodule["path"];
 
    const path = join(__dirname, "cache", "welcgif");
    if (existsSync(path)) mkdirSync(path, { recursive: true }); 
 
    const path2 = join(__dirname, "cache", "joinvideo", "randomgif");
    if (!existsSync(path2)) mkdirSync(path2, { recursive: true });
 
    return;
}
 
 
module.exports.run = async function({ api, event }) {
    const { threadID } = event;

    // Ignore welcome message when the bot itself joins
    if (event.logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {
        return;
    }

    const { join } = require("path");
    const fs = require("fs-extra");
    const request = require("request");
    const { rand } = require("./join.js"); // Get random image from join.js

    try {
        const { threadName, participantIDs } = await api.getThreadInfo(threadID);
        const threadData = global.data.threadData.get(parseInt(threadID)) || {};

        let mentions = [], nameArray = [], memLength = [], i = 0;
        
        for (let user of event.logMessageData.addedParticipants) {
            const userName = user.fullName;
            nameArray.push(userName);
            mentions.push({ tag: userName, id: user.userFbId });
            memLength.push(participantIDs.length - i++);
        }

        memLength.sort((a, b) => a - b);

        let msg = (typeof threadData.customJoin == "undefined")
            ? "Hi, {name}.\nWelcome to {threadName}. You're the {soThanhVien}th member of this group, please enjoy! 🥳❤️"
            : threadData.customJoin;

        msg = msg
            .replace(/\{name}/g, nameArray.join(', '))
            .replace(/\{type}/g, (memLength.length > 1) ? 'Friends' : 'Friend')
            .replace(/\{soThanhVien}/g, memLength.join(', '))
            .replace(/\{threadName}/g, threadName);

        // Download image from URL
        const imagePath = join(__dirname, "cache", `welcome.jpg`);
        request(rand).pipe(fs.createWriteStream(imagePath)).on("close", () => {
            const formPush = {
                body: msg,
                attachment: fs.createReadStream(imagePath),
                mentions
            };

            api.sendMessage(formPush, threadID, () => {
                if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
            });
        });

    } catch (e) {
        console.log("JOIN NOTI ERROR:", e);
    }
};
