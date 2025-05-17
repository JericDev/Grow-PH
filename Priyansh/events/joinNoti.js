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
    if (!existsSync(path)) mkdirSync(path, { recursive: true }); 

    const path2 = join(__dirname, "cache", "joinGif", "randomgif");
    if (!existsSync(path2)) mkdirSync(path2, { recursive: true });

    return;
};

module.exports.run = async function({ api, event }) {
    const { join } = global.nodemodule["path"];
    const fs = require("fs");
    const { threadID } = event;

    // Bot joined group
    if (event.logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {
        api.changeNickname(`[ ${global.config.PREFIX} ] • ${global.config.BOTNAME || ""}`, threadID, api.getCurrentUserID());
        return api.sendMessage("", threadID, () => 
            api.sendMessage({
                body: `${global.config.BOTNAME} - Bot Connected.\n𝐌𝐲 𝐍𝐚𝐦𝐞 𝐈𝐬 ${global.config.BOTNAME}\nMy Prefix Is [ ${global.config.PREFIX} ]\nType ${global.config.PREFIX}help to see my cmd list\nMy Owner Is ${global.config.BOTOWNER}\nUse ${global.config.PREFIX}Callad For Any Issues:\n\n::𝐄𝐱𝐚𝐦𝐩𝐥𝐞::\n ${global.config.PREFIX}gpt ${global.config.PREFIX}ai ${global.config.PREFIX}sim\n${global.config.PREFIX}ship ${global.config.PREFIX}pair ${global.config.PREFIX}pinte\n${global.config.PREFIX}help ${global.config.PREFIX}giveaway ${global.config.PREFIX}banwords`,
                attachment: fs.createReadStream(__dirname + "/cache/welc.gif")
            }, threadID)
        );
    }

    // New user joined
    try {
        const { createReadStream, existsSync, readdirSync } = global.nodemodule["fs-extra"];
        let { threadName, participantIDs } = await api.getThreadInfo(threadID);
        const threadData = global.data.threadData.get(parseInt(threadID)) || {};

        let mentions = [], nameArray = [], memLength = [], i = 0;
        for (const user of event.logMessageData.addedParticipants) {
            nameArray.push(user.fullName);
            mentions.push({ tag: user.fullName, id: user.userFbId });
            memLength.push(participantIDs.length - i++);
        }

        memLength.sort((a, b) => a - b);

        let msg = threadData.customJoin || "Hi, {name}.\nWelcome to {threadName}. You're the {soThanhVien}th member of this group, please enjoy!🥳❤️";
        msg = msg
            .replace(/\{name}/g, nameArray.join(', '))
            .replace(/\{type}/g, (memLength.length > 1) ? 'Friends' : 'Friend')
            .replace(/\{soThanhVien}/g, memLength.join(', '))
            .replace(/\{threadName}/g, threadName);

        const randomGifDir = join(__dirname, "cache", "joinGif", "randomgif");
        const randomFiles = readdirSync(randomGifDir);
        const hasFiles = randomFiles.length > 0;

        const formPush = {
            body: msg,
            mentions,
            ...(hasFiles ? { attachment: createReadStream(join(randomGifDir, randomFiles[Math.floor(Math.random() * randomFiles.length)])) } : {})
        };

        return api.sendMessage(formPush, threadID);
    } catch (err) {
        console.log("joinNoti error:", err);
    }
};
