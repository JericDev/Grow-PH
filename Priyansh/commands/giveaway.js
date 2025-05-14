module.exports.config = {
	name: "giveaway",
	version: "0.0.1",
	hasPermssion: 0,
	credits: "𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭 (fixed by OpenAI)",
	description: "Simple giveaway system",
	commandCategory: "other",
	usages: "[create/details/join/roll/end] [IDGiveAway]",
	cooldowns: 5
};

module.exports.handleReaction = async ({ api, event, Users, handleReaction }) => {
	let data = global.data.GiveAway.get(handleReaction.ID);
	if (!data || data.status === "close" || data.status === "ended") return;

	const userID = event.userID;
	const hasReacted = typeof event.reaction !== "undefined";

	const threadInfo = await api.getThreadInfo(event.threadID);
	const userName = threadInfo.nicknames?.[userID] || (await Users.getInfo(userID)).name;

	if (hasReacted) {
		if (!data.joined.includes(userID)) data.joined.push(userID);
		api.sendMessage(`${userName} đã tham gia thành công giveaway có ID: #${handleReaction.ID}`, event.threadID);
	} else {
		const index = data.joined.indexOf(userID);
		if (index !== -1) data.joined.splice(index, 1);
		api.sendMessage(`${userName} đã rời giveaway có ID: #${handleReaction.ID}`, event.threadID);
	}

	global.data.GiveAway.set(handleReaction.ID, data);
};

module.exports.run = async ({ api, event, args, Users }) => {
	if (!global.data.GiveAway) global.data.GiveAway = new Map();
	const senderID = event.senderID;
	const threadID = event.threadID;

	switch (args[0]) {
		case "create": {
			const reward = args.slice(1).join(" ");
			if (!reward) return api.sendMessage("Vui lòng nhập phần thưởng!", threadID, event.messageID);

			const ID = Math.floor(100000 + Math.random() * 900000).toString();
			const threadInfo = await api.getThreadInfo(threadID);
			const authorName = threadInfo.nicknames?.[senderID] || (await Users.getInfo(senderID)).name;

			api.sendMessage(
				`====== 🎁 GIVEAWAY 🎁 ======\n👤 Tạo bởi: ${authorName}\n🎁 Phần thưởng: ${reward}\n🆔 ID: #${ID}\n\n✅ Thả cảm xúc vào tin nhắn này để tham gia!`,
				threadID,
				(err, info) => {
					if (err) return;
					global.data.GiveAway.set(ID, {
						ID,
						author: authorName,
						authorID: senderID,
						messageID: info.messageID,
						reward,
						joined: [],
						status: "open"
					});
					client.handleReaction.push({
						name: this.config.name,
						messageID: info.messageID,
						author: senderID,
						ID
					});
				}
			);
			break;
		}

		case "details": {
			const ID = args[1]?.replace("#", "");
			if (!ID) return api.sendMessage("Vui lòng cung cấp ID GiveAway!", threadID, event.messageID);

			const data = global.data.GiveAway.get(ID);
			if (!data) return api.sendMessage("Không tìm thấy GiveAway với ID đã cung cấp!", threadID, event.messageID);

			api.sendMessage(
				`====== 🎁 CHI TIẾT GIVEAWAY ======\n👤 Tạo bởi: ${data.author} (${data.authorID})\n🎁 Phần thưởng: ${data.reward}\n🆔 ID: #${data.ID}\n👥 Tham gia: ${data.joined.length} người\n📌 Trạng thái: ${data.status}`,
				threadID,
				data.messageID
			);
			break;
		}

		case "join": {
			const ID = args[1]?.replace("#", "");
			if (!ID) return api.sendMessage("Vui lòng cung cấp ID GiveAway!", threadID, event.messageID);

			const data = global.data.GiveAway.get(ID);
			if (!data) return api.sendMessage("Không tìm thấy GiveAway với ID đã cung cấp!", threadID, event.messageID);
			if (data.joined.includes(senderID)) return api.sendMessage("Bạn đã tham gia giveaway này rồi!", threadID, event.messageID);

			data.joined.push(senderID);
			global.data.GiveAway.set(ID, data);

			const threadInfo = await api.getThreadInfo(threadID);
			const name = threadInfo.nicknames?.[senderID] || (await Users.getInfo(senderID)).name;
			api.sendMessage(`${name} đã tham gia thành công giveaway có ID: #${ID}`, threadID);
			break;
		}

		case "roll": {
			const ID = args[1]?.replace("#", "");
			if (!ID) return api.sendMessage("Vui lòng cung cấp ID GiveAway!", threadID, event.messageID);

			const data = global.data.GiveAway.get(ID);
			if (!data) return api.sendMessage("Không tìm thấy GiveAway với ID đã cung cấp!", threadID, event.messageID);
			if (data.authorID !== senderID) return api.sendMessage("Bạn không phải là người tổ chức giveaway này!", threadID, event.messageID);
			if (data.joined.length === 0) return api.sendMessage("Không có ai tham gia giveaway!", threadID, event.messageID);

			const winnerID = data.joined[Math.floor(Math.random() * data.joined.length)];
			const winnerInfo = await Users.getInfo(winnerID);

			api.sendMessage({
				body: `🎉 Chúc mừng ${winnerInfo.name} đã thắng giveaway có ID: #${ID}\n🎁 Phần thưởng: ${data.reward}\n📨 Liên hệ: ${data.author} (fb.me/${data.authorID})`,
				mentions: [{
					tag: winnerInfo.name,
					id: winnerID
				}]
			}, threadID);
			break;
		}

		case "end": {
			const ID = args[1]?.replace("#", "");
			if (!ID) return api.sendMessage("Vui lòng cung cấp ID GiveAway!", threadID, event.messageID);

			const data = global.data.GiveAway.get(ID);
			if (!data) return api.sendMessage("Không tìm thấy GiveAway với ID đã cung cấp!", threadID, event.messageID);
			if (data.authorID !== senderID) return api.sendMessage("Bạn không phải là người tổ chức giveaway này!", threadID, event.messageID);

			data.status = "ended";
			global.data.GiveAway.set(ID, data);
			api.unsendMessage(data.messageID);
			api.sendMessage(`🔚 Giveaway ID: #${ID} đã kết thúc!`, threadID);
			break;
		}

		default:
			global.utils.throwError(this.config.name, threadID, event.messageID);
	}
};
