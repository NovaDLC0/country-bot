const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

const DB_PATH = path.join(__dirname, "..", "data", "db.json");

module.exports = {
    name: "countries",

    execute(message) {

        const db = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
        const countries = db.countries || {};

        const entries = Object.entries(countries);

        if (!entries.length) {
            return message.reply("🌍 Нет занятых стран");
        }

        const embed = new EmbedBuilder()
            .setTitle("🌍 Занятые страны")
            .setColor(0x2ECC71)
            .setDescription(
                entries.map(([c, u]) => `🌍 **${c}** → <@${u}>`).join("\n")
            )
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }
};
