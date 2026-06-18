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
// SAFE ID (ВАЖНО)
// =========================
function safe(str) {
    return str.replaceAll(" ", "_");
}

function unsafify(str) {
    return str.replaceAll("_", " ");
}

// =========================
// HANDLER
// =========================
module.exports = async (interaction) => {

    try {

        // =========================
        // 🌍 START PANEL
        // =========================
        if (interaction.isButton() && interaction.customId === "start_country_flow") {

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("select_country")
                    .setLabel("🌍 Выбрать страну")
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId("fill_form")
                    .setLabel("📝 Анкета")
                    .setStyle(ButtonStyle.Success)
            );

            return interaction.reply({
                content: "Выберите действие:",
                components: [row],
                ephemeral: true
            });
        }

        // =========================
        // 🌍 REGION SELECT
        // =========================
        if (interaction.isButton() && interaction.customId === "select_country") {

            const menu = new StringSelectMenuBuilder()
                .setCustomId("region_select")
                .setPlaceholder("🌍 Регион")
                .addOptions([
                    { label: "Европа", value: "europe", emoji: "🇪🇺" },
                    { label: "Америка", value: "america", emoji: "🌎" },
                    { label: "Азия", value: "asia", emoji: "🌏" },
                    { label: "Особые", value: "special", emoji: "🏴" }
                ]);

            return interaction.reply({
                content: "Выберите регион:",
                components: [new ActionRowBuilder().addComponents(menu)],
                ephemeral: true
            });
        }

        // =========================
        // 🌍 REGION → PAGE 1
        // =========================
        if (interaction.isStringSelectMenu() && interaction.customId === "region_select") {

            const region = interaction.values[0];
            const countries = REGIONS[region] || [];

            const page = 0;
            const perPage = 25;

            const chunk = countries.slice(0, perPage);

            const menu = new StringSelectMenuBuilder()
                .setCustomId(`country_${region}_${page}`)
                .setPlaceholder(`Страны (${region})`)
                .addOptions(
                    chunk.map(c => ({
                        label: c,
                        value: c,
                        emoji: "🏳️"
                    }))
                );

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`prev_${region}_${page}`)
                    .setLabel("⬅️")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),

                new ButtonBuilder()
                    .setCustomId(`next_${region}_${page}`)
                    .setLabel("➡️")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(countries.length <= 25)
            );

            return interaction.update({
                components: [
                    new ActionRowBuilder().addComponents(menu),
                    buttons
                ]
            });
        }

        // =========================
        // ➡️ NEXT PAGE
        // =========================
        if (interaction.isButton() && interaction.customId.startsWith("next_")) {

            const [, region, pageStr] = interaction.customId.split("_");

            const countries = REGIONS[region] || [];
            const page = parseInt(pageStr) + 1;

            const perPage = 25;
            const chunk = countries.slice(page * perPage, (page + 1) * perPage);

            const menu = new StringSelectMenuBuilder()
                .setCustomId(`country_${region}_${page}`)
                .setPlaceholder(`Страны (${region})`)
                .addOptions(
                    chunk.map(c => ({
                        label: c,
                        value: c,
                        emoji: "🏳️"
                    }))
                );

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`prev_${region}_${page}`)
                    .setLabel("⬅️")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === 0),

                new ButtonBuilder()
                    .setCustomId(`next_${region}_${page}`)
                    .setLabel("➡️")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled((page + 1) * perPage >= countries.length)
            );

            return interaction.update({
                components: [
                    new ActionRowBuilder().addComponents(menu),
                    buttons
                ]
            });
        }

        // =========================
        // ⬅️ PREV PAGE
        // =========================
        if (interaction.isButton() && interaction.customId.startsWith("prev_")) {

            const [, region, pageStr] = interaction.customId.split("_");

            const countries = REGIONS[region] || [];
            const page = Math.max(0, parseInt(pageStr) - 1);

            const perPage = 25;
            const chunk = countries.slice(page * perPage, (page + 1) * perPage);

            const menu = new StringSelectMenuBuilder()
                .setCustomId(`country_${region}_${page}`)
                .setPlaceholder(`Страны (${region})`)
                .addOptions(
                    chunk.map(c => ({
                        label: c,
                        value: c,
                        emoji: "🏳️"
                    }))
                );

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`prev_${region}_${page}`)
                    .setLabel("⬅️")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === 0),

                new ButtonBuilder()
                    .setCustomId(`next_${region}_${page}`)
                    .setLabel("➡️")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled((page + 1) * perPage >= countries.length)
            );

            return interaction.update({
                components: [
                    new ActionRowBuilder().addComponents(menu),
                    buttons
                ]
            });
        }

        // =========================
        // 🏳️ COUNTRY → MODAL (FIXED)
        // =========================
        if (interaction.isStringSelectMenu() && interaction.customId.startsWith("country_")) {

            const country = interaction.values[0];

            const modal = new ModalBuilder()
                .setCustomId(`modal_${safe(country)}`)
                .setTitle(`Заявка`);

            const q1 = new TextInputBuilder()
                .setCustomId("rules")
                .setLabel("Правила сервера?")
                .setStyle(TextInputStyle.Short);

            const q2 = new TextInputBuilder()
                .setCustomId("vpi")
                .setLabel("Что такое ВПИ?")
                .setStyle(TextInputStyle.Short);

            const q3 = new TextInputBuilder()
                .setCustomId("age")
                .setLabel("Возраст?")
                .setStyle(TextInputStyle.Short);

            modal.addComponents(
                new ActionRowBuilder().addComponents(q1),
                new ActionRowBuilder().addComponents(q2),
                new ActionRowBuilder().addComponents(q3)
            );

            return interaction.showModal(modal);
        }

        // =========================
        // 📝 MODAL SUBMIT (100% FIX)
        // =========================
        if (interaction.isModalSubmit() && interaction.customId.startsWith("modal_")) {

            const country = unsafify(interaction.customId.replace("modal_", ""));

            const rules = interaction.fields.getTextInputValue("rules") || "—";
            const vpi = interaction.fields.getTextInputValue("vpi") || "—";
            const age = interaction.fields.getTextInputValue("age") || "—";

            const db = loadDB();

            db.users[interaction.user.id] = {
                status: "pending",
                country,
                updatedAt: Date.now()
            };

            saveDB(db);

            const config = require("../config.json");

            const channel = await interaction.guild.channels.fetch(config.requestsChannel).catch(() => null);

            if (!channel) {
                return interaction.reply({
                    content: "❌ Канал заявок не найден",
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setTitle("📝 Новая заявка")
                .setColor("Purple")
                .addFields(
                    { name: "Игрок", value: interaction.user.tag },
                    { name: "Страна", value: country },
                    { name: "Правила", value: rules.slice(0, 1024) },
                    { name: "ВПИ", value: vpi.slice(0, 1024) },
                    { name: "Возраст", value: age }
                );

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`approve_${interaction.user.id}`)
                    .setLabel("Одобрить")
                    .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                    .setCustomId(`reject_${interaction.user.id}`)
                    .setLabel("Отклонить")
                    .setStyle(ButtonStyle.Danger)
            );

            await channel.send({ embeds: [embed], components: [row] });

            return interaction.reply({
                content: "Заявка отправлена",
                ephemeral: true
            });
        }

        // =========================
        // 🧠 APPROVE / REJECT FIXED
        // =========================
        if (interaction.isButton() &&
            (interaction.customId.startsWith("approve_") ||
             interaction.customId.startsWith("reject_"))) {

            const [action, userId] = interaction.customId.split("_");

            const db = loadDB();

            const member = await interaction.guild.members.fetch(userId).catch(() => null);

            if (action === "approve") {

                db.users[userId].status = "approved";
                saveDB(db);

                if (member) {
                    const role = interaction.guild.roles.cache.find(r =>
                        r.name === "Государство"
                    );
                    if (role) await member.roles.add(role).catch(() => {});
                }
            }

            if (action === "reject") {
                db.users[userId].status = "rejected";
                saveDB(db);
            }

            return interaction.reply({
                content: "Обработано",
                ephemeral: true
            });
        }

    } catch (err) {
        console.error("HANDLER ERROR:", err);

        if (!interaction.replied) {
            await interaction.reply({
                content: "❌ Ошибка в боте",
                ephemeral: true
            });
        }
    }
};
