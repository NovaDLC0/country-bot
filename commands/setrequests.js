const fs = require("fs");

const DB_PATH = "../data/db.json";

function loadDB() {
    try {
        return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
    } catch {
        return { settings: {}, applications: {}, countries: {} };
    }
}

function saveDB(db) {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

module.exports = {
    name: "setrequests",

    async execute(message) {

        // =========================
        // PERMISSION
        // =========================
        if (!message.member.permissions.has("Administrator")) {
            return message.reply("❌ Нет прав");
        }

        const db = loadDB();

        db.settings = db.settings || {};

        db.settings.requestsChannel = message.channel.id;

        saveDB(db);

        return message.reply(`✅ Канал заявок установлен: <#${message.channel.id}>`);
    }
};
