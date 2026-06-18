const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    EmbedBuilder
} = require("discord.js");

const fs = require("fs");
const REGIONS = require("../data/regions");

const DB_PATH = "./db.json";

// =========================
// 📦 DB
// =========================
function loadDB() {
    try {
        return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
    } catch {
        return { users: {} };
    }
}

function saveDB(db) {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// =========================
// MAIN
// =========================
module.exports = async (interaction) => {

    try {

        // =========================
        // 📩 PANEL START
        // =========================
        if (interaction.isButton() && interaction.customId === "start_country_flow") {

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("select_country")
                    .setLabel("🌍 Выбрать страну")
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId("fill_form")
                    .setLabel("📝 Заполнить анкету")
                    .setStyle(ButtonStyle.Success)
            );

            return interaction.reply({
                content: "Выберите действие:",
                components: [row],
                ephemeral: true
            });
        }

        // =========================
        // 🌍 REGION MENU
        // =========================
        if (interaction.isButton() && interaction.customId === "select_country") {

            const menu = new StringSelectMenuBuilder()
                .setCustomId("region_select")
                .setPlaceholder("🌍 Выберите регион")
                .addOptions([
                    { label: "Европа", value: "europe", emoji: "🇪🇺" },
                    { label: "Америка", value: "america", emoji: "🌎" },
                    { label: "Азия", value: "asia", emoji: "🌏" },
                    { label: "Особые", value: "special", emoji: "🏴" }
                ]);

            return interaction.reply({
                content: "🌍 Выберите регион:",
                components: [new ActionRowBuilder().addComponents(menu)],
                ephemeral: true
            });
        }

        // =========================
        // 🌍 REGION → COUNTRIES (PAGINATION)
        // =========================
        if (interaction.isStringSelectMenu() && interaction.customId === "region_select") {

            const region = interaction.values[0];
            const countries = REGIONS[region] || [];

            const page = 0;
            const perPage = 25;

            const chunk = countries.slice(0, perPage);

            const menu = new StringSelectMenuBuilder()
                .setCustomId(`country_select_${region}_${page}`)
                .setPlaceholder(`🏳️ ${region} (стр. 1)`)
                .addOptions(
                    chunk.map(c => ({
                        label: c,
                        value: c,
                        emoji: "🏳️"
                    }))
                );

            return interaction.update({
                content: `🏳️ Выберите страну (${region})`,
                components: [new ActionRowBuilder().addComponents(menu)]
            });
        }

        // =========================
        // 🏳️ COUNTRY → MODAL
        // =========================
        if (interaction.isStringSelectMenu() && interaction.customId.startsWith("country_select_")) {

            const country = interaction.values[0];

            const modal = new ModalBuilder()
                .setCustomId(`application_modal_${country}`)
                .setTitle(`📝 Заявка: ${country}`);

            const q1 = new TextInputBuilder()
                .setCustomId("rules")
                .setLabel("📜 Понимаете правила сервера?")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const q2 = new TextInputBuilder()
                .setCustomId("vpi")
                .setLabel("🌍 Что такое ВПИ?")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const q3 = new TextInputBuilder()
                .setCustomId("age")
                .setLabel("🎂 Сколько вам лет?")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(q1),
                new ActionRowBuilder().addComponents(q2),
                new ActionRowBuilder().addComponents(q3)
            );

            return interaction.showModal(modal);
        }

        // =========================
        // 📝 MODAL SUBMIT
        // =========================
        if (interaction.isModalSubmit() && interaction.customId.startsWith("application_modal_")) {

            const country = interaction.customId.replace("application_modal_", "");

            const rules = interaction.fields.getTextInputValue("rules");
            const vpi = interaction.fields.getTextInputValue("vpi");
            const age = interaction.fields.getTextInputValue("age");

            const db = loadDB();

            db.users[interaction.user.id] = {
                status: "pending",
                country,
                updatedAt: Date.now()
            };

            saveDB(db);

            const embed = new EmbedBuilder()
                .setTitle("📝 Новая заявка")
                .setColor("Purple")
                .addFields(
                    { name: "👤 Игрок", value: interaction.user.tag, inline: true },
                    { name: "🏳️ Страна", value: country, inline: true },
                    { name: "📜 Правила", value: rules },
                    { name: "🌍 ВПИ", value: vpi, inline: true },
                    { name: "🎂 Возраст", value: age, inline: true },
                    { name: "📌 Статус", value: "🟡 На рассмотрении" }
                )
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`pending_${interaction.user.id}`)
                    .setLabel("🟡 В рассмотрении")
                    .setStyle(ButtonStyle.Secondary),

                new ButtonBuilder()
                    .setCustomId(`approve_${interaction.user.id}`)
                    .setLabel("🟢 Одобрить")
                    .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                    .setCustomId(`reject_${interaction.user.id}`)
                    .setLabel("🔴 Отклонить")
                    .setStyle(ButtonStyle.Danger)
            );

            const config = require("../config.json");

            const channel = await interaction.guild.channels.fetch(config.requestsChannel).catch(() => null);

            if (channel) {
                await channel.send({
                    embeds: [embed],
                    components: [row]
                });
            }

            return interaction.reply({
                content: "✅ Заявка отправлена",
                ephemeral: true
            });
        }

        // =========================
        // 🧠 MODERATION
        // =========================
        if (interaction.isButton() && (
            interaction.customId.startsWith("approve_") ||
            interaction.customId.startsWith("reject_") ||
            interaction.customId.startsWith("pending_")
        )) {

            const [action, userId] = interaction.customId.split("_");

            const db = loadDB();

            if (!db.users[userId]) {
                return interaction.reply({
                    content: "❌ Заявка не найдена",
                    ephemeral: true
                });
            }

            const member = await interaction.guild.members.fetch(userId).catch(() => null);

            let status = "";
            let color = "";
            let dm = "";

            if (action === "approve") {

                db.users[userId].status = "approved";
                db.users[userId].updatedAt = Date.now();

                status = "🟢 Одобрено";
                color = "Green";
                dm = "🟢 Ваша заявка одобрена";

                // 🎯 РОЛЬ ГОСУДАРСТВО
                if (member) {
                    const role = interaction.guild.roles.cache.find(r =>
                        r.name === "Государство"
                    );

                    if (role) {
                        await member.roles.add(role).catch(() => {});
                    }
                }
            }

            if (action === "reject") {

                db.users[userId].status = "rejected";
                db.users[userId].updatedAt = Date.now();

                status = "🔴 Отклонено";
                color = "Red";
                dm = "🔴 Ваша заявка отклонена";
            }

            if (action === "pending") {
                status = "🟡 На рассмотрении";
                color = "Yellow";
            }

            saveDB(db);

            if (member && action !== "pending") {
                member.send(`${dm}\n👑 Модератор: ${interaction.user.tag}`).catch(() => {});
            }

            const embed = EmbedBuilder.from(interaction.message.embeds[0])
                .setColor(color)
                .addFields({ name: "📌 Статус", value: status });

            await interaction.message.edit({
                embeds: [embed],
                components: action === "pending" ? interaction.message.components : []
            });

            return interaction.reply({
                content: `${status} | ${interaction.user.tag}`,
                ephemeral: true
            });
        }

    } catch (err) {
        console.error("BUTTON HANDLER ERROR:", err);
    }
};
