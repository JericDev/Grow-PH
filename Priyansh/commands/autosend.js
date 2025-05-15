const schedule = require('node-schedule');
const moment = require('moment-timezone');
const chalk = require('chalk');

module.exports.config = {
    name: 'autosent',
    version: '10.0.0',
    hasPermssion: 0,
    credits: '𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭',
    description: 'Set Karne Ke Bad Automatically Msg Send Karega',
    commandCategory: 'group messenger',
    usages: '[]',
    cooldowns: 3
};

const messages = [
    { time: '6:00 AM', message: 'Goodmorning everyone, have a nice day😍' },
    { time: '8:00 AM', message: 'Goodmorning everyone, have a nice day 🤗' },
    { time: '10:00 AM', message: 'Kumain na kayo? kung hindi pa kain na 🥰' },
    { time: '12:00 PM', message: 'Good afternoon guys 🌅' },
    { time: '1:00 PM', message: 'nag lunch kana? tinatanong kita baka kasi walang nagtatanong ng ganan sayo 😢' },
    { time: '3:00 PM', message: 'meryenda na aba 🍔' },
    { time: '6:00 PM', message: 'Good evening guys, kamusta ka?' },
    { time: '8:00 PM', message: 'nag dinner kana po ba love?' },
    { time: '9:00 PM', message: 'Goodevening humans, its already evening time, have you all eaten? 🤔' },
    { time: '10:00 PM', message: 'Goodnight guys, have a sweet dreams😴😴' },
    { time: '11:00 PM', message: 'Tulog kana hindi ka naman mahal nun 🤣' }
];

module.exports.onLoad = ({ api }) => {
    console.log(chalk.bold.hex("#00c300")("============ SUCCESFULLY LOADED THE AUTOSENT COMMAND ============"));

    messages.forEach(({ time, message }) => {
        const [hour, minute, period] = time.split(/[: ]/);
        let hour24 = parseInt(hour, 10);
        if (period === 'PM' && hour !== '12') {
            hour24 += 12;
        } else if (period === 'AM' && hour === '12') {
            hour24 = 0;
        }

        const scheduledTime = moment.tz({ hour: hour24, minute: parseInt(minute, 10) }, 'Asia/Manila').toDate();

        schedule.scheduleJob(scheduledTime, () => {
            global.data.allThreadID.forEach(threadID => {
                api.sendMessage(message, threadID, (error) => {
                    if (error) {
                        console.error(`Failed to send message to ${threadID}:`, error);
                    }
                });
            });
        });
    });
};

module.exports.run = () => {
    // This function can be left empty as the main logic is handled in onLoad
};
