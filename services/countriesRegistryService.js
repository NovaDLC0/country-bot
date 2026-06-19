const { EmbedBuilder } = require("discord.js");
const { readDB } = require("./dbService");
const { getConfig, saveConfig } = require("./configService");
const REGIONS = require("../data/regions");

// =========================
// ПОЛУЧИТЬ СТАТИСТИКУ
// =========================
function getStats(db) {
    const allCountries = Object.values(REGIONS).flat();
    const total = allCountries.length;

    const occupied = Object.keys(db.countries || {}).length;
    const free = total - occupied;

    return { total, occupied, free };
}

// =========================
// СОБРАТЬ ЭМБЕД РЕЕСТРА
// =========================
function buildCountriesRegistryEmbed(db) {

    const { total, occupied, free } = getStats(db);

    const countriesMap = db.countries || {};

    const lines = [];

    // =========================
    // REGION RENDER
    // =========================
    for (const [regionName, list] of Object.entries(REGIONS)) {

        lines.push(`\n**🌍 ${regionName.toUpperCase()}**`);

        for (const country of list) {

            if (countriesMap[country]) {
                lines.push(`🚫 ${country} → <@${countriesMap[country]}>`);
            } else {
                lines.push(`✅ ${country}`);
            }
        }
    }

    const embed = new EmbedBuilder()
        .setTitle("🌍 Реестр государств")
        .setColor(0x3498db)
        .setDescription(
            `📊 Занято: ${occupied}/${total}\n🟢 Свободно: ${free}\n\n` +
            lines.join("\n")
        )
        .setFooter({ text: "WORLD WIDE v0.1.7 BETA" });

    return embed;
}

// =========================
// ОБНОВИТЬ / СОЗДАТЬ СООБЩЕНИЕ
// =========================
async function updateCountriesRegistry(client) {

    const config = getConfig();
    const db = readDB();

    const channelId = config.countriesChannelId;
    const messageId = config.countriesMessageId;

    if (!channelId) return;

    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) return;

    const embed = buildCountriesRegistryEmbed(db);

    // =========================
    // ПЕРВОЕ СОЗДАНИЕ
    // =========================
    if (!messageId) {

        const msg = await channel.send({ embeds: [embed] });

        config.countriesMessageId = msg.id;
        saveConfig(config);

        return;
    }

    // =========================
    // ОБНОВЛЕНИЕ
    // =========================
    const msg = await channel.messages.fetch(messageId).catch(() => null);

    if (!msg) {
        const newMsg = await channel.send({ embeds: [embed] });

        config.countriesMessageId = newMsg.id;
        saveConfig(config);

        return;
    }

    await msg.edit({ embeds: [embed] });
}

module.exports = {
    buildCountriesRegistryEmbed,
    updateCountriesRegistry
};
