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

const { getConfig, saveConfig } = require("./services/configService");
const { assignCountry } = require("./services/countryService");
const { readDB, saveDB } = require("./services/dbService");

// =========================
// VERSION
// =========================
const BOT_VERSION = "0.1.6";

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

    client.user.setActivity(`🌍 WORLD WIDE v${BOT_VERSION}`, { type: "Watching" });

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

    const db = readDB();

    // =========================
    // PANEL
    // =========================
    if (message.content === "!panel") {
        return message.channel.send(buildCountriesPanel());
    }

    // =========================
    // COUNTRIES
    // =========================
    if (message.content === "!countries") {

        const list = Object.entries(db.countries || {})
            .map(([country, userId]) => `🌍 **${country}** → <@${userId}>`)
            .join("\n") || "Пусто";

        const embed = new EmbedBuilder()
            .setTitle(`🌍 Занятые страны v${BOT_VERSION}`)
            .setColor(0x3498db)
            .setDescription(list);

        return message.channel.send({ embeds: [embed] });
    }

if (message.content === "!admin") {

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("admin_panel")
            .setLabel("🛠 Админ панель")
            .setStyle(ButtonStyle.Danger)
    );

    return message.channel.send({
        content: "Админ панель:",
        components: [row]
    });
}

if (message.content === "!ping") {

    const sent = await message.reply("🏓 Проверяю пинг...");

    const ping = sent.createdTimestamp - message.createdTimestamp;

    return sent.edit(`🏓 Pong!\n📶 Ping: ${ping}ms\n🤖 API: ${message.client.ws.ping}ms`);
}

    // =========================
    // SET REQUESTS
    // =========================
    if (message.content.startsWith("!setrequests")) {

        if (!message.member.permissions.has("Administrator")) {
            return message.reply("❌ Нет прав");
        }

        const channel = message.mentions.channels.first();
        if (!channel) return message.reply("!setrequests #channel");

        const config = getConfig();
        config.requestsChannel = channel.id;
        saveConfig(config);

        return message.reply(`✅ Канал заявок установлен`);
    }

    // =========================
    // SET COUNTRY
    // =========================
    if (message.content.startsWith("!setcountry")) {

        if (!message.member.permissions.has("Administrator")) {
            return message.reply("❌ Нет прав");
        }

        const user = message.mentions.users.first();
        const country = message.content.split(" ").slice(2).join(" ");

        if (!user || !country) {
            return message.reply("!setcountry @user страна");
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

    // =========================
    // REMOVE COUNTRY (FIXED)
    // =========================
    if (message.content.startsWith("!removecountry")) {

        if (!message.member.permissions.has("Administrator")) {
            return message.reply("❌ Нет прав");
        }

        const user = message.mentions.users.first();
        if (!user) return message.reply("!removecountry @user");

        db.countries = db.countries || {};

        let removed = null;

        for (const country in db.countries) {
            if (db.countries[country] === user.id) {
                removed = country;
                delete db.countries[country];
                break;
            }
        }

        if (!removed) {
            return message.reply("❌ У пользователя нет страны");
        }

        saveDB(db);

        return message.reply(`❌ Убрана страна **${removed}** у ${user.tag}`);
    }

    // =========================
    // NEWS
    // =========================
    if (message.content.startsWith("!news ")) {

        const NEWS_CHANNEL_ID = "1163909514374955018";

        if (message.channel.id !== NEWS_CHANNEL_ID) {
            return message.reply("❌ Только новости");
        }

        if (!message.member.permissions.has("Administrator")) {
            return message.reply("❌ Нет прав");
        }

        const text = message.content.slice(6);

        const embed = new EmbedBuilder()
            .setTitle("📰 Новости")
            .setColor(0xf1c40f)
            .setDescription(text)
            .setFooter({ text: message.author.tag })
            .setTimestamp();

        return message.channel.send({ embeds: [embed] });
    }

    // =========================
    // DM COMMAND
    // =========================
    if (message.channel.type === 1) {

        if (message.author.id === "1195596012849483808") {

            if (message.content.startsWith("!говори ")) {

                const args = message.content.split(" ");
                const channelId = args[1].replace(/[<#>]/g, "");
                const text = args.slice(2).join(" ");

                const channel = client.channels.cache.get(channelId);

                if (!channel) return message.reply("❌ Канал не найден");

                await channel.send(text);
                return message.reply("✅ Отправлено");
            }
        }
    }
});

// =========================
// BUTTONS
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
