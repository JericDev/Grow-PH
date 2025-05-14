module.exports.config = {
    name: "rules",
    version: "1.0.0",
    hasPermission: 0,
    credits: "Zia_Rein",
    description: "important notes",
    commandCategory: "random-img",
    usages: "send message",
    cooldowns: 5,
    dependencies: {
        "request": "",
        "fs-extra": "",
        "axios": ""
    }
};

module.exports.run = async({ api, event, args, client, Users, Threads, __GLOBAL, Currencies }) => {
    const axios = global.nodemodule["axios"];
    const request = global.nodemodule["request"];
    const fs = global.nodemodule["fs-extra"];
    
    var ZiaRein3 = `𝙂𝘼𝙂 𝙏𝘼𝙈𝘽𝘼𝙔𝘼𝙉 𝙍𝙐𝙇𝙀𝙎🌶️
⚠️ Respect the Admins.
⚠️ Respect all Members.
⚠️ Scamming is not allowed.
⚠️ Be friendly and avoid toxic behavior.
⚠️ Spamming is not allowed.
⚠️ Sending multiple photos or videos is not allowed.
⚠️ Always use Midman/Middlewoman.
⚠️ Spamming is not allowed.
⚠️ Sending Links is not allowed. = Kick
    
Failure to follow the rules may result in a warning, kick or ban.!`;

    var ZiaRein = [
        "https://i.imgur.com/huumLca.jpg",
        "https://i.imgur.com/EcryTGh.jpg",
        "https://i.imgur.com/tu12HrQ.jpg",
        "https://i.imgur.com/Vx25FHG.jpg",
        "https://i.imgur.com/NcbC8Pn.jpg",
    ];

    var ZiaRein2 = () => {
        api.sendMessage({
            body: ZiaRein3,
            attachment: fs.createReadStream(__dirname + "/cache/ZiaRein1.jpg")
        }, event.threadID, () => {
            fs.unlinkSync(__dirname + "/cache/ZiaRein1.jpg"); // Delete file after sending message
        }, event.messageID);
    };

    // Download the image and save it to the cache
    return request(encodeURI(ZiaRein[Math.floor(Math.random() * ZiaRein.length)]))
        .pipe(fs.createWriteStream(__dirname + "/cache/ZiaRein1.jpg"))
        .on("close", () => ZiaRein2()); // After image is downloaded, send the message
};
