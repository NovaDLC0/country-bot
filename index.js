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

client.once("ready", () => {
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

//
// 📩 КОМАНДЫ (messageCreate)
//
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    // 📊 панель стран
    if (message.content === "!panel") {
        const panel = buildCountriesPanel();
        message.channel.send(panel);
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
        message.reply("🏓 Pong!");
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

//
// 🎮 КНОПКИ + INTERACTIONS
//
client.on("interactionCreate", async (interaction) => {
    try {
        await handleButtons(interaction);
    } catch (err) {
        console.log("Interaction error:", err);
    }
});

//
// 🔑 LOGIN
//
client.login(process.env.TOKEN);
