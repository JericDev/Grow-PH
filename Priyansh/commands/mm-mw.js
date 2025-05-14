module.exports.config = {
    name: "mm-mw",
    version: "1.0.0",
    hasPermission: 0,
    credits: "𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭",
    description: "Create a new group and add mentioned users.",
    commandCategory: "group",
    usages: "<mention or userID>",
    cooldowns: 5
};

async function getUserId(url, api) {
    const regexName = new RegExp(/"title":"(.*?)"/s);
    const regexId = /"userID":"(\d+)"/;
    try {
        if (url.includes("facebook.com")) {
            let data = await api.get(url);
            let regex = /for \(;;\);{"redirect":"(.*?)"}/.exec(data);
            if (data.includes("for (;;)")) {
                data = await api.get(regex[1].replace(/\\/g, '').replace(/(?<=\?\s*)(.*)/, '').slice(1, -1));
            }
            let regexid = regexId.exec(data);
            let name = JSON.parse(`{"name":"${data.match(regexName)[1]}"}`)["name"];
            return [parseInt(regexid[1]), name, false];
        } else {
            return [null, null, true];
        }
    } catch {
        return [null, null, true];
    }
}

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const botID = api.getCurrentUserID();
    const out = msg => api.sendMessage(msg, threadID, messageID);

    var { participantIDs, adminIDs, approvalMode } = await api.getThreadInfo(threadID);
    participantIDs = participantIDs.map(e => parseInt(e));

    if (!args[0]) return out("Please mention at least one user or provide a userID to add.");

    // Function to add a user to the group
    async function addToGroup(id) {
        try {
            await api.addUserToGroup(id, threadID);
        } catch (e) {
            return false;
        }
        return true;
    }

    // Check if the first argument is a mention or user ID
    if (event.mentions) {
        let idsToAdd = [];
        // Get mentioned users' IDs
        for (const userID in event.mentions) {
            idsToAdd.push(userID);
        }
        // Add the senderID (the user who invoked the command) to the list
        idsToAdd.push(senderID);

        // Create the group and add users
        try {
            const groupName = "New Group Created by Bot"; // Customize this group name
            await api.createGroup(groupName, idsToAdd); // Creating the new group
            return out(`Successfully created a group and added the mentioned users!`);
        } catch (e) {
            return out("Failed to create the group. Please try again.");
        }
    } else if (!isNaN(args[0])) {
        // If user ID is provided instead of a mention, add the user with that ID
        const id = args[0];
        try {
            // Add the sender and the user provided by the ID
            const groupName = "New Group Created by Bot"; // Customize this group name
            await api.createGroup(groupName, [senderID, id]); // Creating the new group
            return out(`Successfully created a group and added the user with ID ${id}!`);
        } catch (e) {
            return out("Failed to create the group. Please try again.");
        }
    } else {
        return out("Invalid input. Please mention at least one user or provide a userID.");
    }
};
