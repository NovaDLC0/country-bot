const fs = require("fs");

const DB_PATH = "../data/db.json";

function loadDB() {
    try {
        return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
    } catch {
        return { applications: {}, countries: {} };
    }
}

function saveDB(db) {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

module.exports = {
    name: "setcountry",

    async execute(message, args) {

        // =========================
        // PERMISSION CHECK
        // =========================
        if (!message.member.permissions.has("Administrator")) {
            return message.reply("❌ Нет прав");
        }

        // =========================
        // INPUT
        // =========================
        const userId = args[0];
        const country = args.slice(1).join(" ");

        if (!userId || !country) {
            return message.reply("❌ Использование: !setcountry <userId> <страна>");
        }

        const db = loadDB();

        // =========================
        // FIND USER APP
        // =========================
        const app = Object.values(db.applications || {})
            .find(a => a.userId === userId);

        if (!app) {
            return message.reply("❌ Пользователь не найден в заявках");
        }

        // =========================
        // REMOVE OLD COUNTRY
        // =========================
        for (const [c, id] of Object.entries(db.countries || {})) {
            if (id === userId) {
                delete db.countries[c];
            }
        }

        // =========================
        // SET NEW COUNTRY
        // =========================
        db.countries[country] = userId;

        app.country = country;
        app.status = "approved";

        saveDB(db);

        return message.reply(`✅ Страна ${country} выдана пользователю ${app.tag}`);
    }
};
