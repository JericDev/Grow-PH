const logger = require("../../utils/log.js");
const moment = require("moment");

module.exports = function ({ api, models, Users, Threads, Currencies }) {
  return function ({ event }) {
    const timeStart = Date.now();
    const time = moment.tz("Asia/Kolkata").format("HH:mm:ss L");

    const { userBanned, threadBanned } = global.data;
    const { events } = global.client;
    const { allowInbox, DeveloperMode } = global.config;

    let { senderID, threadID } = event;
    senderID = String(senderID);
    threadID = String(threadID);

    // ❌ Skip if user/thread is banned or DM is not allowed
    if (
      userBanned.has(senderID) ||
      threadBanned.has(threadID) ||
      (allowInbox === false && senderID === threadID)
    ) {
      return;
    }

    // ✅ Check if sender is an admin in the group
    const isAdmin = async () => {
      try {
        const threadInfo = await api.getThreadInfo(threadID);
        return threadInfo.adminIDs.some(admin => admin.id === senderID);
      } catch (err) {
        console.error('Error fetching thread info:', err);
        return false;
      }
    };

    // ✅ Loop through all registered event handlers
    for (const [key, value] of events.entries()) {
      // Check if eventType matches logMessageType
      if (value.config?.eventType?.includes(event.logMessageType)) {
        const eventRun = events.get(key);
        try {
          // Skip processing if the sender is an admin
          if (await isAdmin()) {
            return; // If admin, skip the punishment
          }

          const Obj = {
            api,
            event,
            models,
            Users,
            Threads,
            Currencies
          };

          eventRun.run(Obj);

          if (DeveloperMode === true) {
            logger(
              global.getText(
                'handleEvent',
                'executeEvent',
                time,
                eventRun.config.name,
                threadID,
                Date.now() - timeStart
              ),
              '[ Event ]'
            );
          }
        } catch (error) {
          logger(
            global.getText(
              'handleEvent',
              'eventError',
              value.config?.name || key,
              JSON.stringify(error)
            ),
            "error"
          );
        }
      }
    }

    return;
  };
};
