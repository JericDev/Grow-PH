module.exports.run = async function({ api, event }) {
    const { createReadStream } = global.nodemodule["fs-extra"];
    const { join } = global.nodemodule["path"];
    const fs = require("fs");
    const threadID = event.threadID;

    // Bot joined group (keep this as is)
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

        // Use your join.js image URL here:
        const imageUrl = "https://i.imgur.com/QmlY12B.jpeg";  // note: direct image link, not imgur page link

        // Send message with image URL attachment
        return api.sendMessage({
            body: msg,
            mentions,
            attachment: await global.utils.getStreamFromURL(imageUrl)
        }, threadID);

    } catch (err) {
        console.log("joinNoti error:", err);
    }
};

