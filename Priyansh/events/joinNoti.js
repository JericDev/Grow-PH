module.exports.config = {
    name: "joinNoti",
    eventType: ["log:subscribe"],
    version: "1.0.1",
    credits: "CatalizCS",
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
 
    const path = join(__dirname, "cache", "joinGif");
    if (existsSync(path)) mkdirSync(path, { recursive: true }); 
 
    const path2 = join(__dirname, "cache", "joinGif", "randomgif");
    if (!existsSync(path2)) mkdirSync(path2, { recursive: true });
 
    return;
}
 
 
module.exports.run = async function({ api, event }) {
    const { join } = global.nodemodule["path"];
    const { threadID } = event;
    if (event.logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {
        api.changeNickname(`[ ${global.config.PREFIX} ] • ${(!global.config.BOTNAME) ? " " : global.config.BOTNAME}`, threadID, api.getCurrentUserID());
        const fs = require("fs");
        return api.sendMessage("", event.threadID, () => api.sendMessage({body: `${global.config.BOTNAME} - Bot Connected.\n𝐌𝐲 𝐍𝐚𝐦𝐞 𝐈𝐬 ${global.config.BOTNAME}\nMy Prefix Is [ ${global.config.PREFIX} ]\nType ${global.config.PREFIX}help to see my cmd list\nMy Owner Is ${global.config.BOTOWNER}\nUse ${global.config.PREFIX}Callad For Any Issues:\n\n::𝐄𝐱𝐚𝐦𝐩𝐥𝐞::\n ${global.config.PREFIX}gpt ${global.config.PREFIX}ai ${global.config.PREFIX}sim\n${global.config.PREFIX}ship ${global.config.PREFIX}pair ${global.config.PREFIX}pinte\n${global.config.PREFIX}help ${global.config.PREFIX}help all ${global.config.PREFIX}help3\n `, attachment: fs.createReadStream(__dirname + "/cache/joinGif/welc.gif")} ,threadID));
    }
}
