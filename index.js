const { Client, GatewayIntentBits } = require("discord.js");

const { buildCountriesPanel } = require("./panels/countries/countriesPanel");
const handleButtons = require("./handlers/buttonsHandler");

const { getConfig, saveConfig } = require("./services/configService");
const { readDB } = require("./services/dbService");

const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
    ]
});

// ==========================================
// 🔥 READY EVENT
// ==========================================
client.once("ready", () => {

    client.user.setActivity("🌍 WORLD WIDE", { type: "WATCHING" });

    client.user.setPresence({
        status: "online",
        activities: [{
            name: "WORLD WIDE",
            type: "WATCHING"
        }]
    });

    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖  WORLD WIDE BOT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🟢 Status: ONLINE
🌍 Mode: Global Country System
⚡ Version: Global Beta 0.1.1

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Bot: ${client.user.tag}
🆔 ID: ${client.user.id}
📡 Servers: ${client.guilds.cache.size}
👥 Users: ${client.users.cache.size}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 System: READY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
});

// ==========================================
// 💬 MESSAGE COMMANDS
// ==========================================
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    // 📊 PANEL
    if (message.content === "!panel") {

        const panel = buildCountriesPanel();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("apply_country")
                .setLabel("🌍 Выбор страны")
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId("start_form")
                .setLabel("📝 Анкета")
                .setStyle(ButtonStyle.Primary)
        );

        return message.channel.send({
            ...panel,
            components: [row]
        });
    }

    // 🌍 COUNTRIES LIST
    if (message.content === "!countries") {

        const db = readDB();

        const list = Object.entries(db.countries || {})
            .map(([country, userId]) => `🌍 **${country}** — <@${userId}>`)
            .join("\n") || "Пусто";

        const embed = new EmbedBuilder()
            .setTitle("🌍 Занятые страны")
            .setDescription(list)
            .setColor("Blue");

        return message.channel.send({ embeds: [embed] });
    }

    // 📰 NEWS
    if (message.content.startsWith("!news ")) {

        const NEWS_CHANNEL_ID = "1163909514374955018";

        if (message.channel.id !== NEWS_CHANNEL_ID) {
            return message.reply("❌ Новости можно писать только в канале новостей.");
        }

        if (!message.member.permissions.has("Administrator")) {
            return message.reply("❌ Нужны права администратора.");
        }

        const text = message.content.slice(6);

        const embed = new EmbedBuilder()
            .setTitle("📰 Новости")
            .setDescription(text)
            .setColor("Gold")
            .setFooter({ text: `От: ${message.author.tag}` })
            .setTimestamp();

        return message.channel.send({ embeds: [embed] });
    }

    // 📋 SET REQUESTS CHANNEL
    if (message.content.startsWith("!setrequests")) {

        if (!message.member.permissions.has("Administrator")) {
            return message.reply("❌ Нужны права администратора.");
        }

        const channel = message.mentions.channels.first();
        if (!channel) return message.reply("Использование: !setrequests #канал");

        const config = getConfig();
        config.requestsChannel = channel.id;
        saveConfig(config);

        return message.reply(`✅ Канал заявок установлен: ${channel}`);
    }

    // 🧪 PING
    if (message.content === "!ping") {
        return message.reply("🏓 Pong!");
    }

    // 📩 DM COMMAND
    if (message.channel.type === 1) {

        if (message.author.id === "1195596012849483808") {

            if (message.content.startsWith("!говори ")) {

                const args = message.content.slice(9).split(" ");
                const channelMention = args[0];
                const text = args.slice(1).join(" ");

                const channelId = channelMention.replace(/[<#>]/g, "");
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

// ==========================================
// 🎮 INTERACTIONS
// ==========================================
client.on("interactionCreate", async (interaction) => {
    try {
        await handleButtons(interaction);
    } catch (err) {
        console.log("Interaction error:", err);
    }
});

// ==========================================
// 🔑 LOGIN
// ==========================================
client.login(process.env.TOKEN);
