const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require("discord.js");

const { getConfig } = require("../services/configService");
const { assignCountry } = require("../services/countryService");

// 🌍 РЕГИОНЫ
const REGIONS = {
    europe: ["Латвия","Литва","Эстония","Сан-Марино","Андорра","Ватикан","Люксембург","Испания","Португалия","Ирландия","Венгрия","Австрия","Норвегия","Дания","Финляндия","Греция","Великобритания","Франция","Италия","Польша","Нидерланды","Бельгия","Швеция","Швейцария","Румыния","Болгария","СССР"],
    america: ["США","Канада","Мексика","Бразилия","Аргентина","Чили","Перу","Колумбия"],
    asia: ["Япония","Китай","Индия","Турция","Иран","Монголия"],
    special: ["Тыва","Тибет","Маньчжурия","Синьцзян"]
};

// 🧠 защита от повторной обработки
const processedForms = new Set();

module.exports = async (interaction) => {

    // =========================
    // 🌍 КНОПКА "ВЫБОР СТРАНЫ"
    // =========================
    if (interaction.isButton() && interaction.customId === "apply_country") {

        const menu = new StringSelectMenuBuilder()
            .setCustomId("region_select")
            .setPlaceholder("🌍 Выберите регион")
            .addOptions([
                { label: "Европа", value: "europe", emoji: "🌍" },
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
    // 🌍 ВЫБОР РЕГИОНА
    // =========================
    if (interaction.isStringSelectMenu() && interaction.customId === "region_select") {

        const region = interaction.values[0];

        const menu = new StringSelectMenuBuilder()
            .setCustomId("country_select")
            .setPlaceholder("🌍 Выберите страну")
            .addOptions(
                REGIONS[region].map(c => ({
                    label: c,
                    value: c
                }))
            );

        return interaction.update({
            content: "🌍 Выберите страну:",
            components: [new ActionRowBuilder().addComponents(menu)]
        });
    }

    // =========================
    // 🌍 ВЫБОР СТРАНЫ → ЗАЯВКА
    // =========================
    if (interaction.isStringSelectMenu() && interaction.customId === "country_select") {

        const countryName = interaction.values[0];
        const config = getConfig();

        const channel = await interaction.guild.channels.fetch(config.requestsChannel).catch(() => null);

        const requestId = `${interaction.user.id}_${countryName}`;

        const embed = new EmbedBuilder()
            .setTitle("📋 Новая заявка")
            .addFields(
                { name: "👤 Игрок", value: interaction.user.tag, inline: true },
                { name: "🌍 Страна", value: countryName, inline: true },
                { name: "📌 Статус", value: "🟡 На рассмотрении" }
            )
            .setColor("Blue")
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`pending_form_${interaction.user.id}`)
                .setLabel("🟡 На рассмотрении")
                .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId(`approve_form_${interaction.user.id}`)
                .setLabel("🟢 Одобрить")
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId(`reject_form_${interaction.user.id}`)
                .setLabel("🔴 Отказать")
                .setStyle(ButtonStyle.Danger)
        );

        if (channel) {
            await channel.send({ embeds: [embed], components: [row] });
        }

        return interaction.update({
            content: `📋 Заявка отправлена: ${countryName}`,
            components: []
        });
    }

    // =========================
    // 📝 КНОПКА АНКЕТЫ → MODAL
    // =========================
    if (interaction.isButton() && interaction.customId === "start_form") {

        const modal = new ModalBuilder()
            .setCustomId("application_modal")
            .setTitle("📝 Анкета");

        const q1 = new TextInputBuilder()
            .setCustomId("rules")
            .setLabel("Ознакомлены с правилами?")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const q2 = new TextInputBuilder()
            .setCustomId("age")
            .setLabel("Сколько вам полных лет?")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const q3 = new TextInputBuilder()
            .setCustomId("vpi")
            .setLabel("Что такое ВПИ?")
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
    // 📝 ОТПРАВКА АНКЕТЫ
    // =========================
    if (interaction.isModalSubmit() && interaction.customId === "application_modal") {

        const rules = interaction.fields.getTextInputValue("rules");
        const age = interaction.fields.getTextInputValue("age");
        const vpi = interaction.fields.getTextInputValue("vpi");

        const config = getConfig();
        const channel = await interaction.guild.channels.fetch(config.requestsChannel).catch(() => null);

        const embed = new EmbedBuilder()
            .setTitle("📝 Новая анкета")
            .addFields(
                { name: "📜 Правила", value: rules },
                { name: "🎂 Возраст", value: age },
                { name: "🌍 ВПИ", value: vpi },
                { name: "👤 Пользователь", value: `<@${interaction.user.id}>` }
            )
            .setColor("Purple")
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`pending_form_${interaction.user.id}`)
                .setLabel("🟡 На рассмотрении")
                .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId(`approve_form_${interaction.user.id}`)
                .setLabel("🟢 Одобрить")
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId(`reject_form_${interaction.user.id}`)
                .setLabel("🔴 Отказать")
                .setStyle(ButtonStyle.Danger)
        );

        if (channel) {
            await channel.send({ embeds: [embed], components: [row] });
        }

        return interaction.reply({
            content: "✅ Анкета отправлена",
            ephemeral: true
        });
    }

    // =========================
    // 🧠 ОБРАБОТКА АНКЕТ (МОДЕРАТОРЫ)
    // =========================
    if (interaction.isButton() && interaction.customId.includes("_form_")) {

        const parts = interaction.customId.split("_");
        const action = parts[0];   // approve / reject / pending
        const userId = parts[2];

        const moderator = interaction.user;

        if (processedForms.has(userId)) {
            return interaction.reply({
                content: "❌ Уже обработано",
                ephemeral: true
            });
        }

        const member = await interaction.guild.members.fetch(userId).catch(() => null);

        // 🟡 просмотр
        if (action === "pending") {
            return interaction.reply({
                content: `🟡 Взято в рассмотрение\n👑 Модератор: ${moderator.tag}`,
                ephemeral: true
            });
        }

        // 🟢 одобрение
        if (action === "approve") {

            processedForms.add(userId);

            if (member) {
                await member.send(`🟢 Анкета одобрена\n👑 Модератор: ${moderator.tag}`).catch(() => {});
            }

            await interaction.message.edit({
                components: [],
                embeds: interaction.message.embeds
            }).catch(() => {});

            return interaction.reply({
                content: `🟢 Одобрено\n👑 Модератор: ${moderator.tag}`,
                ephemeral: true
            });
        }

        // 🔴 отказ
        if (action === "reject") {

            processedForms.add(userId);

            if (member) {
                await member.send(`🔴 Анкета отклонена\n👑 Модератор: ${moderator.tag}`).catch(() => {});
            }

            await interaction.message.edit({
                components: [],
                embeds: interaction.message.embeds
            }).catch(() => {});

            return interaction.reply({
                content: `🔴 Отклонено\n👑 Модератор: ${moderator.tag}`,
                ephemeral: true
            });
        }
    }
};
