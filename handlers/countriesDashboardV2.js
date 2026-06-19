const { EmbedBuilder } = require("discord.js");
const { readDB } = require("../services/dbService");
const REGIONS = require("../data/regions");

// =========================
// FLAGS + HISTORICAL SUPPORT
// =========================
const COUNTRY_FLAGS = {
    "Россия": "🇷🇺",
    "СССР": "🇷🇺",
    "США": "🇺🇸",
    "Канада": "🇨🇦",

    "Германия": "🇩🇪",
    "Веймарская Республика": "🇩🇪",

    "Франция": "🇫🇷",
    "Италия": "🇮🇹",
    "Испания": "🇪🇸",
    "Португалия": "🇵🇹",
    "Великобритания": "🇬🇧",

    "Польша": "🇵🇱",
    "Нидерланды": "🇳🇱",
    "Бельгия": "🇧🇪",
    "Швеция": "🇸🇪",
    "Швейцария": "🇨🇭",
    "Румыния": "🇷🇴",
    "Болгария": "🇧🇬",

    "Чехословакия": "🇨🇿",
    "Чехия": "🇨🇿",

    "Югославия": "🇷🇸",

    "Турция": "🇹🇷",
    "Османская империя": "🇹🇷",

    "Иран": "🇮🇷",
    "Персия": "🇮🇷",

    "Япония": "🇯🇵",
    "Китай": "🇨🇳",
    "Монголия": "🇲🇳",

    "Бразилия": "🇧🇷",
    "Аргентина": "🇦🇷",
    "Мексика": "🇲🇽",
    "Чили": "🇨🇱",
    "Колумбия": "🇨🇴",
    "Перу": "🇵🇪",
    "Венесуэла": "🇻🇪",
    "Уругвай": "🇺🇾",
    "Куба": "🇨🇺",

    "Египет": "🇪🇬",
    "Эфиопия": "🇪🇹",
    "Южно-Африканский Союз": "🇿🇦",

    "Австралия": "🇦🇺",
    "Новая Зеландия": "🇳🇿",

    "Сиам": "🇹🇭",
    "Таиланд": "🇹🇭"
};

// =========================
// FLAG GETTER
// =========================
function getFlag(country) {
    return COUNTRY_FLAGS[country] || "🏳️";
}

// =========================
// DASHBOARD V2
// =========================
function buildDashboardV2() {

    const db = readDB();
    const taken = db.countries || {};

    const allCountriesRaw = Object.values(REGIONS || {}).flat();
    const uniqueCountries = [...new Set(allCountriesRaw)]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "ru"));

    let occupied = 0;

    const lines = uniqueCountries.map(country => {

        const ownerId = taken[country];

        const flag = getFlag(country);

        if (ownerId) {
            occupied++;
            return `🚫 ${flag} **${country}** → <@${ownerId}>`;
        }

        return `✅ ${flag} **${country}** → Свободно`;
    });

    const embed = new EmbedBuilder()
        .setTitle("🌍  WORLD MAP")
        .setColor(0x3498db)
        .setDescription(lines.join("\n"))
        .setFooter({
            text: `Занято: ${occupied}/${uniqueCountries.length}`
        });

    return embed;
}

module.exports = { buildDashboardV2 };
