const { readDB, saveDB } = require("./dbService");

module.exports = async (interaction) => {
    const db = readDB();

    // 🌍 выдать страну
    if (interaction.customId.startsWith("country_set_")) {

        const userId = interaction.customId.split("_")[2];
        const country = interaction.customId.split("_")[3] || "UNKNOWN";

        db.countries[userId] = country;
        saveDB(db);

        return interaction.reply({
            content: `🌍 Страна **${country}** выдана <@${userId}>`,
            ephemeral: true
        });
    }

    // ❌ снять страну
    if (interaction.customId.startsWith("country_remove_")) {

        const userId = interaction.customId.split("_")[2];

        delete db.countries[userId];
        delete db.warns[userId];

        saveDB(db);

        return interaction.reply({
            content: `❌ Страна снята с <@${userId}>`,
            ephemeral: true
        });
    }

    // ⚠️ варны
    if (interaction.customId.startsWith("country_warn_")) {

        const userId = interaction.customId.split("_")[2];

        db.warns[userId] = (db.warns[userId] || 0) + 1;

        const count = db.warns[userId];

        const country = db.countries[userId];

        // 2 варна = снятие страны
        if (count >= 2) {
            delete db.countries[userId];
            delete db.warns[userId];

            saveDB(db);

            return interaction.reply({
                content: `🚨 <@${userId}> получил 2 варна и потерял страну **${country || "NONE"}**`,
                ephemeral: false
            });
        }

        saveDB(db);

        return interaction.reply({
            content: `⚠️ Варн выдан <@${userId}> (${count}/2)`,
            ephemeral: true
        });
    }

    // 📊 инфо
    if (interaction.customId.startsWith("country_info_")) {

        const userId = interaction.customId.split("_")[2];

        const country = db.countries[userId] || "Нет страны";
        const warns = db.warns[userId] || 0;

        return interaction.reply({
            content: `🌍 Страна: ${country}\n⚠️ Варны: ${warns}/2`,
            ephemeral: true
        });
    }
};
