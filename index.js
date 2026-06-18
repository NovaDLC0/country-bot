const { Client, GatewayIntentBits } = require("discord.js");

const { buildCountriesPanel } = require("./panels/countriesPanel");
const handleButtons = require("./handlers/buttonsHandler");
const { getConfig, saveConfig } = require("./services/configService");

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
// 🔥 ЗАПУСК БОТА + СТАТУСЫ
// ==========================================
client.once("clientReady", () => {
    // ==========================================
    // 1️⃣ СТАТУС АКТИВНОСТИ (Activity Status)
    // ==========================================
    client.user.setActivity("🌍 WORLD WIDE", { type: "WATCHING" });

    // ==========================================
    // 2️⃣ КАСТОМНЫЙ СТАТУС (Custom Status)
    // ==========================================
    client.user.setPresence({
        status: "online",
        activities: [{
            name: "Люблю WORLD WIDE ❤️",
            type: "CUSTOM",
            state: "Люблю WORLD WIDE ❤️"
        }]
    });

    console.log("\x1b[36m%s\x1b[0m", `
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║     ██████╗ ██████╗ ██╗   ██╗███╗   ██╗████████╗██████╗   ║
    ║    ██╔════╝██╔═══██╗██║   ██║████╗  ██║╚══██╔══╝██╔══██╗  ║
    ║    ██║     ██║   ██║██║   ██║██╔██╗ ██║   ██║   ██████╔╝  ║
    ║    ██║     ██║   ██║██║   ██║██║╚██╗██║   ██║   ██╔══██╗  ║
    ║    ╚██████╗╚██████╔╝╚██████╔╝██║ ╚████║   ██║   ██║  ██║  ║
    ║     ╚═════╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝  ║
    ║                                                              ║
    ║              🤖 БОТ УСПЕШНО ЗАПУЩЕН! 🚀                    ║
    ║                                                              ║
    ╠══════════════════════════════════════════════════════════════╣
    ║  📌 Имя:     ${(client.user.tag).padEnd(30)}║
    ║  🆔 ID:      ${(client.user.id).padEnd(30)}║
    ║  📊 Серверов: ${(String(client.guilds.cache.size)).padEnd(30)}║
    ║  👥 Пользователей: ${(String(client.users.cache.size)).padEnd(30)}║
    ║  ⏰ Запущен: ${(new Date().toLocaleString()).padEnd(30)}║
    ╠══════════════════════════════════════════════════════════════╣
    ║  ✅ Бот готов к работе!                                     ║
    ║                                                              ║
    ║  📋 КОМАНДЫ НА СЕРВЕРЕ:                                     ║
    ║  💬 !panel     - Открыть панель стран                      ║
    ║  💬 !countries - Показать список стран                     ║
    ║  💬 !setrequests #канал - Установить канал заявок         ║
    ║  💬 !ping      - Проверить задержку                        ║
    ║                                                              ║
    ║  📩 КОМАНДЫ В ЛИЧНЫХ СООБЩЕНИЯХ:                           ║
    ║  💬 !говори #канал текст - Отправить сообщение от бота    ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
    `);
});

// ==========================================
// 📩 КОМАНДЫ (messageCreate)
// ==========================================
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

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

    const { EmbedBuilder } = require("discord.js");
    const { readDB } = require("./services/dbService");

    if (message.content === "!countries") {
        const db = readDB();
        const list = Object.entries(db.countries)
            .map(([country, userId]) => `🌍 **${country}** — <@${userId}>`)
            .join("\n") || "Пусто";

        const embed = new EmbedBuilder()
            .setTitle("🌍 Занятые страны")
            .setDescription(list)
            .setColor("Blue");

        return message.channel.send({ embeds: [embed] });
    }

// 📰 NEWS (ТОЛЬКО ОДИН КАНАЛ)
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

    message.channel.send({ embeds: [embed] });
}
    // 📋 установить канал заявок
    if (message.content.startsWith("!setrequests")) {
        if (!message.member.permissions.has("Administrator")) {
            return message.reply("❌ Нужны права администратора.");
        }

        const channel = message.mentions.channels.first();

        if (!channel) {
            return message.reply("Использование: !setrequests #канал");
        }

        const config = getConfig();
        config.requestsChannel = channel.id;
        saveConfig(config);

        return message.reply(`✅ Канал заявок установлен: ${channel}`);
    }

    // 🧪 тест
    if (message.content === "!ping") {
        return message.reply("🏓 Pong!");
    }

    // ==========================================
    // 📩 КОМАНДА !говори (ТОЛЬКО ИЗ ЛИЧНЫХ СООБЩЕНИЙ)
    // ==========================================
    if (message.channel.type === 1) {
        if (message.author.id === '1195596012849483808') {
            if (message.content.startsWith('!говори ')) {
                const args = message.content.slice(9).split(' ');
                const channelMention = args[0];
                const text = args.slice(1).join(' ');

                if (!channelMention || !text) {
                    return message.reply('❌ Использование: !говори #канал текст');
                }

                const channelId = channelMention.replace(/[<#>]/g, '');
                const channel = client.channels.cache.get(channelId);

                if (!channel) {
                    return message.reply('❌ Канал не найден!');
                }

                try {
                    await channel.send(text);
                    await message.reply(`✅ Отправлено в ${channelMention}`);
                } catch (error) {
                    await message.reply(`❌ Ошибка: ${error.message}`);
                }
            }
        }
    }
});

// ==========================================
// 🎮 КНОПКИ + INTERACTIONS
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
