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

const REGIONS = require('../data/regions');
const { readDB, saveDB } = require("../services/dbService");

// =========================
// COOLDOWN
// =========================
function isCooldown(db, userId) {
    db.cooldowns = db.cooldowns || {};

    const now = Date.now();

    if (db.cooldowns[userId] && db.cooldowns[userId] > now) {
        return true;
    }

    db.cooldowns[userId] = now + 1000 * 60 * 60 * 24;
    return false;
}

// =========================
// HELPERS
// =========================
function getPendingApps(db) {
    return Object.values(db.applications || {}).filter(a => a.status === "pending");
}

// =========================
// MAIN
// =========================
module.exports = async (interaction) => {

    const client = interaction.client;

    try {

if (interaction.isButton() && interaction.customId.startsWith("emb_channel_")) {

    const id = interaction.customId.split("_")[2];

    const menu = new StringSelectMenuBuilder()
        .setCustomId(`emb_channel_select_${id}`)
        .setPlaceholder("📺 Выберите канал")
        .addOptions(
            interaction.guild.channels.cache
                .filter(c => c.isTextBased())
                .map(c => ({
                    label: `#${c.name}`,
                    value: c.id
                }))
                .slice(0, 25)
        );

    return interaction.reply({
        content: "📺 Выберите канал для эмбеда:",
        components: [new ActionRowBuilder().addComponents(menu)],
        flags: 64
    });
}

if (interaction.isStringSelectMenu() && interaction.customId.startsWith("emb_channel_select_")) {

    const id = interaction.customId.split("_")[3];
    const channelId = interaction.values[0];

    const db = readDB();

    db.embeds = db.embeds || {};
    db.embeds[id] = db.embeds[id] || {};

    db.embeds[id].channelId = channelId;

    saveDB(db);

    return interaction.update({
        content: `✅ Канал сохранён: <#${channelId}>`,
        components: []
    });
}

if (interaction.isButton() && interaction.customId.startsWith("emb_publish_")) {

    const id = interaction.customId.split("_")[2];

    const db = readDB();
    const embeds = db.embeds || {};

    const data = embeds[id];

    if (!data) {
        return interaction.reply({
            content: "❌ Embed не найден",
            flags: 64
        });
    }

    if (!data.channelId) {
        return interaction.reply({
            content: "❌ Канал не выбран",
            flags: 64
        });
    }

    const channel = await interaction.client.channels.fetch(data.channelId).catch(() => null);

    if (!channel) {
        return interaction.reply({
            content: "❌ Канал не найден или недоступен",
            flags: 64
        });
    }

    const embed = new EmbedBuilder()
        .setTitle(data.title || "Без заголовка")
        .setDescription(data.description || "Пусто")
        .setColor(data.color || "#3498db");

    if (data.footer) embed.setFooter({ text: data.footer });
    if (data.thumbnail) embed.setThumbnail(data.thumbnail);
    if (data.image) embed.setImage(data.image);

    await channel.send({ embeds: [embed] });

    return interaction.reply({
        content: "🚀 Эмбед успешно отправлен!",
        flags: 64
    });
} 

       // =====================================================
        // START FLOW
        // =====================================================
        if (interaction.isButton() && interaction.customId === "start_country_flow") {

            return interaction.reply({
                content: "🌍 Меню стран",
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId("select_country")
                            .setLabel("🌍 Подать заявку")
                            .setStyle(ButtonStyle.Primary)
                    )
                ],
                flags: 64
            });
        }

        // =====================================================
        // SELECT COUNTRY BUTTON → REGIONS
        // =====================================================
        if (interaction.isButton() && interaction.customId === "select_country") {

            const menu = new StringSelectMenuBuilder()
                .setCustomId("region_select")
                .setPlaceholder("🌍 Выберите регион")
                .addOptions([
                    { label: "Европа 1", value: "europe_1" },
                    { label: "Европа 2", value: "europe_2" },
                    { label: "Америка", value: "america" },
                    { label: "Азия", value: "asia" },
                    { label: "Особые", value: "special" }
                ]);

            return interaction.reply({
                content: "🌍 Выберите регион:",
                components: [new ActionRowBuilder().addComponents(menu)],
                flags: 64
            });
        }

        // =====================================================
        // REGION → COUNTRIES
        // =====================================================
        if (interaction.isStringSelectMenu() && interaction.customId === "region_select") {

            const region = interaction.values[0];
            const countries = REGIONS?.[region];

            if (!Array.isArray(countries)) {
                return interaction.reply({
                    content: "❌ Регион не найден",
                    flags: 64
                });
            }

            const menu = new StringSelectMenuBuilder()
                .setCustomId("country_select")
                .setPlaceholder("🌍 Выберите страну")
                .addOptions(
                    countries.slice(0, 25).map(c => ({
                        label: c,
                        value: c
                    }))
                );

            return interaction.update({
                components: [new ActionRowBuilder().addComponents(menu)]
            });
        }

        // =====================================================
        // COUNTRY → MODAL
        // =====================================================
        const { canAssignCountry } = require("../services/countryValidator");

	if (interaction.isStringSelectMenu() && interaction.customId === "country_select") {

            const db = readDB();
            const country = interaction.values[0];

            db.countries = db.countries || {};

            if (db.countries[country]) {
                return interaction.reply({
                    content: "❌ Страна уже занята",
                    flags: 64
                });
            }

            if (isCooldown(db, interaction.user.id)) {
                saveDB(db);
                return interaction.reply({
                    content: "⏳ КД 24 часа",
                    flags: 64
                });
            }

            const modal = new ModalBuilder()
                .setCustomId(`modal_${country}`)
                .setTitle("Заявка");

            const rules = new TextInputBuilder()
                .setCustomId("rules")
                .setLabel("Знаете правила?")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const vpi = new TextInputBuilder()
                .setCustomId("vpi")
                .setLabel("Что такое ВПИ?")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const age = new TextInputBuilder()
                .setCustomId("age")
                .setLabel("Возраст")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(rules),
                new ActionRowBuilder().addComponents(vpi),
                new ActionRowBuilder().addComponents(age)
            );

            return interaction.showModal(modal);
        }

        // =====================================================
        // MODAL SUBMIT
        // =====================================================
        if (interaction.isModalSubmit() && interaction.customId.startsWith("modal_")) {

            const db = readDB();

            const country = interaction.customId.replace("modal_", "");

            db.applications = db.applications || {};

            db.applications[interaction.user.id] = {
                userId: interaction.user.id,
                tag: interaction.user.tag,
                country,
                rules: interaction.fields.getTextInputValue("rules"),
                vpi: interaction.fields.getTextInputValue("vpi"),
                age: interaction.fields.getTextInputValue("age"),
                status: "pending"
            };

            saveDB(db);

            return interaction.reply({
                content: "✅ Заявка отправлена",
                flags: 64
            });
        }

        // =====================================================
        // ADMIN QUEUE
        // =====================================================
        if (interaction.isButton() && interaction.customId === "admin_queue") {

            const db = readDB();
            const apps = getPendingApps(db);

            if (!apps.length) {
                return interaction.reply({
                    content: "📭 Заявок нет",
                    flags: 64
                });
            }

            return showApp(interaction, apps, 0);
        }

        // =====================================================
        // PAGINATION
        // =====================================================
        if (interaction.isButton() && interaction.customId.startsWith("app_")) {

            const db = readDB();
            const apps = getPendingApps(db);

            let index = parseInt(interaction.customId.split("_")[2]);

            if (interaction.customId.startsWith("app_next")) index++;
            if (interaction.customId.startsWith("app_prev")) index--;

            if (index < 0) index = 0;
            if (index >= apps.length) index = apps.length - 1;

            return showApp(interaction, apps, index);
        }

        // =====================================================
        // APPROVE
        // =====================================================
        if (interaction.isButton() && interaction.customId.startsWith("approve_")) {

            const db = readDB();
            const userId = interaction.customId.replace("approve_", "");

            const app = db.applications?.[userId];
            if (!app) return;

            app.status = "approved";

            db.countries = db.countries || {};
            db.countries[app.country] = userId;

            saveDB(db);

            const user = await client.users.fetch(userId).catch(() => null);
            if (user) user.send("✅ Ваша заявка одобрена!");

            return interaction.reply({
                content: "✔ Одобрено",
                flags: 64
            });
        }

        // =====================================================
        // REJECT
        // =====================================================
        if (interaction.isButton() && interaction.customId.startsWith("reject_")) {

            const userId = interaction.customId.replace("reject_", "");

            const modal = new ModalBuilder()
                .setCustomId(`reject_modal_${userId}`)
                .setTitle("Причина отказа");

            const reason = new TextInputBuilder()
                .setCustomId("reason")
                .setLabel("Причина")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(reason)
            );

            return interaction.showModal(modal);
        }

        // =====================================================
        // REJECT SUBMIT
        // =====================================================
        if (interaction.isModalSubmit() && interaction.customId.startsWith("reject_modal_")) {

            const db = readDB();
            const userId = interaction.customId.replace("reject_modal_", "");

            const app = db.applications?.[userId];
            if (!app) return;

            const reason = interaction.fields.getTextInputValue("reason");

            app.status = "rejected";
            app.reason = reason;

            saveDB(db);

            const user = await client.users.fetch(userId).catch(() => null);
            if (user) user.send(`❌ Отклонено\nПричина: ${reason}`);

            return interaction.reply({
                content: "❌ Отклонено",
                flags: 64
            });
        }

        // =====================================================
        // ADMIN COMMANDS (PING + ADMIN UI)
        // =====================================================
        if (interaction.isChatInputCommand && interaction.customId === "ping") {
            return interaction.reply({
                content: "🏓 Pong!",
                flags: 64
            });
        }

        if (interaction.isButton() && interaction.customId === "admin_panel") {

            const embed = new EmbedBuilder()
                .setTitle("🛠 Admin Panel")
                .setColor(0xe74c3c)
                .setDescription("Управление заявками и системой");

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("admin_queue")
                    .setLabel("📋 Очередь заявок")
                    .setStyle(ButtonStyle.Primary)
            );

            return interaction.reply({
                embeds: [embed],
                components: [row],
                flags: 64
            });
        }

    } catch (err) {
        console.log("BUTTON ERROR:", err);
    }
};

// =========================
// RENDER
// =========================
function showApp(interaction, apps, index) {

    const app = apps[index];

    const embed = new EmbedBuilder()
        .setTitle(`📋 Заявка ${index + 1}/${apps.length}`)
        .setColor(0xf1c40f)
        .addFields(
            { name: "Игрок", value: app.tag || "—" },
            { name: "Страна", value: app.country || "—" },
            { name: "Возраст", value: app.age || "—" },
            { name: "ВПИ", value: app.vpi || "—" }
        );

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`approve_${app.userId}`)
            .setLabel("Одобрить")
            .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
            .setCustomId(`reject_${app.userId}`)
            .setLabel("Отклонить")
            .setStyle(ButtonStyle.Danger)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`app_prev_${index}`)
            .setLabel("⬅️")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(index === 0),

        new ButtonBuilder()
            .setCustomId(`app_next_${index}`)
            .setLabel("➡️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(index === apps.length - 1)
    );

    return interaction.reply({
        embeds: [embed],
        components: [row1, row2],
        flags: 64
    });
}
