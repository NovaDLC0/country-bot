const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const { buildCountriesPanel } = require("./panels/countriesPanel");
const handleButtons = require("./handlers/buttonsHandler");
const embedsHandler = require("./handlers/embedsHandler");

const { assignCountry, removeCountry } = require("./services/countryService");
const { readDB } = require("./services/dbService");

const countriesDashboardV2 = require("./handlers/countriesDashboardV2");
const { startLiveDashboardV2 } = require("./handlers/liveDashboardV2");

// VERSION
// =========================
const BOT_VERSION = "0.1.7-fix [BETA]";

// =========================
// CLIENT
// =========================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
    ]
});

// =========================
// READY
// =========================
client.once("ready", () => {

    client.user.setActivity(`🌍 WORLD WIDE}`, { type: "Watching" });

    client.user.setPresence({
        status: "online",
        activities: [{
            name: `WORLD WIDE ${BOT_VERSION}`,
            type: 4
        }]
    });

    console.log(`
━━━━━━━━━━━━━━━━━━━━━━
🤖 BOT ONLINE
📦 VERSION: ${BOT_VERSION}
👤 ${client.user.tag}
━━━━━━━━━━━━━━━━━━━━━━
    `);
});

// =========================
// MESSAGE COMMANDS
// =========================
client.on("messageCreate", async (message) => {

    if (message.author.bot) return;

    embedsHandler(message);

    const db = readDB();

    if (message.content === "!panel") {
        return message.channel.send(buildCountriesPanel());
    }

    if (message.content === "!countries") {

        const allCountries = Object.values(require("./data/regions")).flat();
        const unique = [...new Set(allCountries)];

        const countriesDB = db.countries || {};

        let occupied = 0;

        const lines = unique.map(country => {

            const owner = countriesDB[country];

            if (owner) {
                occupied++;
                return `🚫 **${country}** → <@${owner}>`;
            }

            return `🌍 **${country}** → Свободно`;
        });

        const embed = new EmbedBuilder()
            .setTitle(`🌍 Страны (${occupied}/${unique.length})`)
            .setColor(0x3498db)
            .setDescription(lines.join("\n").slice(0, 4000));

        return message.channel.send({ embeds: [embed] });
    }

    if (message.content === "!live") {
        if (!message.member.permissions.has("Administrator")) {
            return message.reply("❌ Нет прав");
        }

        await startLiveDashboardV2(message.channel);

        return message.reply("🌍 Есть контакт! Веду прямой эфир стран...");
    }

    if (message.content === "!admin") {

        if (!message.member.permissions.has("Administrator")) {
            return message.reply("❌ Нет прав");
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("admin_panel")
                .setLabel("🛠 Админ панель")
                .setStyle(ButtonStyle.Danger)
        );

        return message.channel.send({
            content: "🛠 Админ панель:",
            components: [row]
        });
    }

    if (message.content === "!dashboard") {
        const { buildDashboardV2 } = require("./handlers/countriesDashboardV2");

        return message.channel.send({
            embeds: [buildDashboardV2()]
        });
    }

    if (message.content === "!ping") {

        const sent = await message.reply("🏓 Проверяю пинг...");

        const ping = sent.createdTimestamp - message.createdTimestamp;

        return sent.edit(
            `🏓 Pong!\n📶 Ping: ${ping}ms\n🤖 API: ${message.client.ws.ping}ms`
        );
    }

    if (message.content.startsWith("!setcountry")) {

        const user = message.mentions.users.first();
        const country = message.content.split(" ").slice(2).join(" ");

        if (!user || !country) {
            return message.reply("❌ !setcountry @user страна");
        }

        const result = assignCountry(country, {
            id: user.id,
            username: user.username
        });

        if (result?.error) {
            return message.reply(`❌ ${result.error}`);
        }

        return message.reply(`🌍 ${country} → ${user.tag}`);
    }

    if (message.content.startsWith("!removecountry")) {

        const user = message.mentions.users.first();
        if (!user) return message.reply("❌ !removecountry @user");

        const result = removeCountry(user.id);

        if (result?.error) {
            return message.reply(`❌ ${result.error}`);
        }

        return message.reply(`❌ Страна снята у ${user.tag}`);
    }
});


// =========================
// INTERACTIONS
// =========================
client.on("interactionCreate", async (interaction) => {

    try {
        await handleButtons(interaction);
    } catch (err) {
        console.log("BUTTON ERROR:", err);
    }

});

// =========================
// LOGIN
// =========================
client.login(process.env.TOKEN);
