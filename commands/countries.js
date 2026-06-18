const fs = require("fs");

const DB_PATH = "./data/db.json";

function loadDB() {
    try {
        return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
    } catch {
        return { applications: {}, countries: {} };
    }
}

module.exports = {
    name: "countries",

    async execute(message) {

        const db = loadDB();

        const entries = Object.entries(db.countries || {});

        if (!entries.length) {
            return message.reply("📭 Нет занятых стран");
        }

        const text = entries.map(([country, userId]) => {

            const app = Object.values(db.applications || {})
                .find(a => a.userId === userId);

            const name = app?.tag || "Неизвестно";

            return `🌍 **${country}** — 👤 ${name}`;
        });

        return message.reply({
            content: "🏳️ **Список стран (RP):**\n\n" + text.join("\n")
        });
    }
};
