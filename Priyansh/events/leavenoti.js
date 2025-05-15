module.exports.config = {
	name: "leave",
	eventType: ["log:unsubscribe"],
	version: "1.0.0",
	credits: "𝙋𝙧𝙞𝙮𝙖𝙣𝙨𝙝 𝙍𝙖𝙟𝙥𝙪𝙩 (Modified by ChatGPT)",
	description: "Send a leave message when someone leaves the group",
	dependencies: {
		"fs-extra": "",
		"path": ""
	}
};

module.exports.onLoad = function () {
    const { existsSync, mkdirSync } = global.nodemodule["fs-extra"];
    const { join } = global.nodemodule["path"];

    const leaveDir = join(__dirname, "cache", "leaveGif");
    if (!existsSync(leaveDir)) mkdirSync(leaveDir, { recursive: true });
};

module.exports.run = async function({ api, event, Users, Threads }) {
	if (event.logMessageData.leftParticipantFbId == api.getCurrentUserID()) return;

	const { createReadStream, existsSync, readdirSync } = global.nodemodule["fs-extra"];
	const { join } = global.nodemodule["path"];
	const { threadID } = event;

	const name = global.data.userName.get(event.logMessageData.leftParticipantFbId) || await Users.getNameUser(event.logMessageData.leftParticipantFbId);
	const data = global.data.threadData.get(parseInt(threadID)) || (await Threads.getData(threadID)).data;

	const msg = (typeof data.customLeave == "undefined")
		? `Uy may nangiwan!\n\n${name}\nReason: Left the group\nOK lang! ganyan naman kayo,\nsanay na kaming iniiwanan!`
		: data.customLeave.replace(/\{name}/g, name);

	const leaveDir = join(__dirname, "cache", "leaveGif");
	const files = existsSync(leaveDir) ? readdirSync(leaveDir) : [];

	let formPush;
	if (files.length > 0) {
		const randomFile = join(leaveDir, files[Math.floor(Math.random() * files.length)]);
		formPush = { body: msg, attachment: createReadStream(randomFile) };
	} else {
		formPush = { body: msg };
	}

	return api.sendMessage(formPush, threadID);
};
