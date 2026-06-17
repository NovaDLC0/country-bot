const { Client, GatewayIntentBits } = require("discord.js");


const { buildCountriesPanel } = require("./panels/countriesPanel");
const handleButtons = require("./handlers/buttonsHandler");
const { getConfig, saveConfig } = require("./services/configService");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.once("clientReady", () => {
    console.log(`🤖 Бот запущен как ${client.user.tag}`);
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
        return message.reply(
            "Использование: !setrequests #канал"
        );
    }

    const config = getConfig();

    config.requestsChannel = channel.id;

    saveConfig(config);

    return message.reply(
        `✅ Канал заявок установлен: ${channel}`
    );

}
    // 🧪 тест
    if (message.content === "!ping") {
        message.reply("🏓 Pong!");
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
