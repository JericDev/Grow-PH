const fs = require("fs");
const request = require("request");
const { join } = require("path");
const { rand } = require("./join.js");

module.exports.run = async function({ api, event }) {
    const { threadID } = event;

    if (event.logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {
        api.changeNickname(`[ ${global.config.PREFIX} ] • ${global.config.BOTNAME || "Bot"}`, threadID, api.getCurrentUserID());

        return api.sendMessage(
            "",
            threadID,
            () => api.sendMessage({
                body: `${global.config.BOTNAME} - Bot Connected.\n𝐌𝐲 𝐍𝐚𝐦𝐞 𝐈𝐬 ${global.config.BOTNAME}\nMy Prefix Is [ ${global.config.PREFIX} ]\nType ${global.config.PREFIX}help to see my cmd list\nMy Owner Is ${global.config.BOTOWNER}\nUse ${global.config.PREFIX}Callad For Any Issues:\n\n::𝐄𝐱𝐚𝐦𝐩𝐥𝐞::\n ${global.config.PREFIX}gpt ${global.config.PREFIX}ai ${global.config.PREFIX}sim\n${global.config.PREFIX}ship ${global.config.PREFIX}pair ${global.config.PREFIX}pinte\n${global.config.PREFIX}help ${global.config.PREFIX}giveaway ${global.config.PREFIX}banwords\n`,
                attachment: fs.createReadStream(__dirname + "/cache/welc.gif")
            }, threadID)
        );
    }

    try {
        const { createReadStream, existsSync, mkdirSync, readdirSync } = require("fs-extra");
        let { threadName, participantIDs } = await api.getThreadInfo(threadID);
        const threadData = global.data.threadData.get(parseInt(threadID)) || {};
        const path = join(__dirname, "cache", "joinGif");
        const pathGif = join(path, `${threadID}.video`);

        let mentions = [], nameArray = [], memLength = [], i = 0;

        for (const user of event.logMessageData.addedParticipants) {
            const userName = user.fullName;
            nameArray.push(userName);
            mentions.push({ tag: userName, id: user.userFbId });
            memLength.push(participantIDs.length - i++);
        }

        memLength.sort((a, b) => a - b);

        let msg = (typeof threadData.customJoin == "undefined")
            ? "Hi, {name}.\nWelcome to {threadName}. You're The\n{soThanhVien}th member of this group, please enjoy!🥳❤️"
            : threadData.customJoin;

        msg = msg
            .replace(/\{name}/g, nameArray.join(', '))
            .replace(/\{type}/g, (memLength.length > 1) ? 'Friends' : 'Friend')
            .replace(/\{soThanhVien}/g, memLength.join(', '))
            .replace(/\{threadName}/g, threadName);

        // Ensure folder exists
        if (!existsSync(path)) mkdirSync(path, { recursive: true });

        // Load gif or image
        let formPush;

        if (existsSync(pathGif)) {
            formPush = { body: msg, attachment: createReadStream(pathGif), mentions };
        } else if (rand && typeof rand === "string") {
            const imagePath = join(__dirname, "cache", `welcome.jpg`);
            request(rand)
                .pipe(fs.createWriteStream(imagePath))
                .on("close", () => {
                    const form = {
                        body: msg,
                        attachment: fs.createReadStream(imagePath),
                        mentions
                    };
                    api.sendMessage(form, threadID, () => {
                        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
                    });
                });
            return;
        } else {
            formPush = { body: msg, mentions };
        }

        return api.sendMessage(formPush, threadID);
    } catch (e) {
        console.log("JOIN NOTI ERROR:", e);
        return api.sendMessage("❌ Failed to send join notification due to an internal error.", event.threadID);
    }
};

