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

const REGIONS = require("../data/regions");
const { getConfig } = require("../services/configService");

// 🧠 анти-дубли (по желанию)
const processed = new Set();

module.exports = async (interaction) => {

    try {

        // =========================
        // 📩 START PANEL → 2 BUTTONS
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
        // 🌍 COUNTRY FLOW START → REGION SELECT
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
        // 🌍 REGION → COUNTRY SELECT
        // =========================
        if (interaction.isStringSelectMenu() && interaction.customId === "region_select") {

            const region = interaction.values[0];
            const countries = REGIONS[region] || [];

            const menu = new StringSelectMenuBuilder()
                .setCustomId("country_select")
                .setPlaceholder("🏳️ Выберите страну")
                .addOptions(
                    countries.map(c => ({
                        label: c,
                        value: c,
                        emoji: "🏳️"
                    }))
                );

            return interaction.update({
                content: "🏳️ Выберите страну:",
                components: [new ActionRowBuilder().addComponents(menu)]
            });
        }

        // =========================
        // 🏳️ COUNTRY → MODAL
        // =========================
        if (interaction.isStringSelectMenu() && interaction.customId === "country_select") {

            const country = interaction.values[0];

            const modal = new ModalBuilder()
                .setCustomId(`application_modal_${country}`)
                .setTitle(`📝 Заявка: ${country}`);

            const q1 = new TextInputBuilder()
                .setCustomId("rules")
                .setLabel("📜 Понимаете ли вы правила сервера?")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const q2 = new TextInputBuilder()
                .setCustomId("vpi")
                .setLabel("🌍 Понимаете ли вы что такое ВПИ?")
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

            const config = getConfig();
            const channel = await interaction.guild.channels.fetch(config.requestsChannel).catch(() => null);

            const embed = new EmbedBuilder()
                .setTitle("📝 Новая заявка")
                .setColor("Purple")
                .addFields(
                    { name: "👤 Игрок", value: interaction.user.tag, inline: true },
                    { name: "🏳️ Страна", value: country, inline: true },
                    { name: "📜 Знание правил", value: rules },
                    { name: "🌍 Ознакомлен с  ВПИ", value: vpi, inline: true },
                    { name: "🎂 Возраст", value: age, inline: true },
                    { name: "📌 Статус", value: "🟡 На рассмотрении" }
                )
                .setTimestamp();

            if (channel) {
                await channel.send({ embeds: [embed] });
            }

            return interaction.reply({
                content: "✅ Заявка отправлена",
                ephemeral: true
            });
        }

    } catch (err) {
        console.error("BUTTON HANDLER ERROR:", err);
    }
};
