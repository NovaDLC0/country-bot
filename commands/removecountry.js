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
    name: "removecountry",

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
        const country = args.join(" ");

        if (!country) {
            return message.reply("❌ Использование: !removecountry <страна>");
        }

        const db = loadDB();

        // =========================
        // CHECK IF COUNTRY EXISTS
        // =========================
        if (!db.countries || !db.countries[country]) {
            return message.reply("❌ Эта страна не занята");
        }

        const userId = db.countries[country];

        // =========================
        // REMOVE FROM COUNTRIES
        // =========================
        delete db.countries[country];

        // =========================
        // UPDATE APPLICATION STATUS
        // =========================
        const app = Object.values(db.applications || {})
            .find(a => a.userId === userId);

        if (app) {
            app.status = "pending";
            app.handledBy = null;
        }

        saveDB(db);

        return message.reply(`🟢 Страна **${country}** освобождена`);
    }
};
