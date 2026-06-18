const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

const { buildCountriesPanel } = require("./panels/countriesPanel");
const handleButtons = require("./handlers/buttonsHandler");

const { getConfig, saveConfig } = require("./services/configService");
const { assignCountry } = require("./services/countryService");
const { readDB, saveDB } = require("./services/dbService");

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
// 🤖 READY
// =========================
client.once("ready", () => {
    client.user.setActivity("🌍 WORLD WIDE", { type: "Watching" });

    client.user.setPresence({
        status: "online",
        activities: [{
            name: "Люблю WORLD WIDE ❤️",
            type: 4
        }]
    });

    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 BOT ONLINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 ${client.user.tag}
🆔 ${client.user.id}
🌍 Servers: ${client.guilds.cache.size}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
});

// =========================
// 💬 MESSAGE COMMANDS
// =========================
client.on("messageCreate", async (message) => {

    if (message.author.bot) return;

    // =========================
    // 🌍 PANEL
    // =========================
    if (message.content === "!panel") {

        const panel = buildCountriesPanel();

        return message.channel.send({
            ...panel
        });
    }

    // =========================
    // 🌍 COUNTRIES LIST
    // =========================
    if (message.content === "!countries") {

        const db = readDB();

        const list = Object.entries(db.countries || {})
            .map(([country, userId]) => `🌍 **${country}** → <@${userId}>`)
            .join("\n") || "Пусто";

        const embed = new EmbedBuilder()
            .setTitle("🌍 Страны")
            .setDescription(list)
            .setColor("Blue");

        return message.channel.send({ embeds: [embed] });
    }

    // =========================
    // 📰 NEWS
    // =========================
    if (message.content.startsWith("!news ")) {

        const NEWS_CHANNEL_ID = "1163909514374955018";

        if (message.channel.id !== NEWS_CHANNEL_ID) {
            return message.reply("❌ Только в канале новостей.");
        }

        if (!message.member.permissions.has("Administrator")) {
            return message.reply("❌ Нет прав.");
        }

        const text = message.content.slice(6);

        const embed = new EmbedBuilder()
            .setTitle("📰 Новости")
            .setDescription(text)
            .setColor("Gold")
            .setFooter({ text: message.author.tag })
            .setTimestamp();

        return message.channel.send({ embeds: [embed] });
    }

    // =========================
    // 📌 SET REQUEST CHANNEL
    // =========================
    if (message.content.startsWith("!setrequests")) {

        if (!message.member.permissions.has("Administrator")) {
            return message.reply("❌ Нет прав.");
        }

        const channel = message.mentions.channels.first();
        if (!channel) {
            return message.reply("Использование: !setrequests #канал");
        }

        const config = getConfig();
        config.requestsChannel = channel.id;
        saveConfig(config);

        return message.reply(`✅ Канал установлен: ${channel}`);
    }

    // =========================
    // 🌍 SET COUNTRY (ADMIN)
    // =========================
    if (message.content.startsWith("!setcountry")) {

        if (!message.member.permissions.has("Administrator")) {
            return message.reply("❌ Нет прав.");
        }

        const user = message.mentions.users.first();
        const country = message.content.split(" ").slice(2).join(" ");

        if (!user || !country) {
            return message.reply("Использование: !setcountry @user Страна");
        }

        const result = assignCountry(country, {
            id: user.id,
            username: user.username
        });

        if (result?.error) {
            return message.reply(`❌ ${result.error}`);
        }

        return message.reply(`🌍 Выдано: **${country}** → ${user.tag}`);
    }

    // =========================
    // ❌ REMOVE COUNTRY
    // =========================
    if (message.content.startsWith("!removecountry")) {

        if (!message.member.permissions.has("Administrator")) {
            return message.reply("❌ Нет прав.");
        }

        const user = message.mentions.users.first();

        if (!user) {
            return message.reply("Использование: !removecountry @user");
        }

        const db = readDB();

        if (db.countries[user.id]) {
            delete db.countries[user.id];
            saveDB(db);
        }

        return message.reply(`❌ Страна снята с ${user.tag}`);
    }

    // =========================
    // 🏓 PING
    // =========================
    if (message.content === "!ping") {
        return message.reply("🏓 Pong!");
    }

    // =========================
    // 📩 DM COMMAND
    // =========================
    if (message.channel.type === 1) {

        if (message.author.id === "1195596012849483808") {

            if (message.content.startsWith("!говори ")) {

                const args = message.content.slice(9).split(" ");
                const channelId = args[0].replace(/[<#>]/g, "");
                const text = args.slice(1).join(" ");

                const channel = client.channels.cache.get(channelId);

                if (!channel) {
                    return message.reply("❌ Канал не найден");
                }

                await channel.send(text);
                return message.reply("✅ Отправлено");
            }
        }
    }
});

// =========================
// 🎮 BUTTONS
// =========================
client.on("interactionCreate", async (interaction) => {
    try {
        await handleButtons(interaction);
    } catch (err) {
        console.log("Interaction error:", err);
    }
});

// =========================
// 🔑 LOGIN
// =========================
client.login(process.env.TOKEN);
