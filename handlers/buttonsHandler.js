const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const { getConfig } = require("../services/configService");
const { assignCountry } = require("../services/countryService");

// 🌍 РЕГИОНЫ
const REGIONS = {
    europe: [
        "Латвия","Литва","Эстония","Сан-Марино","Андорра","Ватикан",
        "Люксембург","Югославия","Испания","Португалия","Ирландия",
        "Венгрия","Австрия","Норвегия","Дания","Финляндия","Греция",
        "Великобритания","Веймарская Республика","Франция","Италия",
        "Чехословакия","Польша","Нидерланды","Бельгия","Швеция",
        "Швейцария","Румыния","Болгария","СССР"
    ],
    america: [
        "Эквадор","Гватемала","Гондурас","Коста-Рика","Панама",
        "Никарагуа","Сальвадор","Доминиканская Республика","Гаити",
        "Перу","Уругвай","Куба","Бразилия","Мексика","Чили",
        "Венесуэла","Колумбия","США","Канада","Аргентина",
        "Ньюфаундленд"
    ],
    asia: [
        "Афганистан","Ирак","Йемен","Непал","Оман","Монголия",
        "Персия","Сиам","Турция","Египет","Япония","Австралия",
        "Новая Зеландия","Южно-Африканский Союз","Эфиопия","Либерия"
    ],
    special: [
        "Тыва","Тибет","Синьцзянское султанат",
        "Нанкинская республика","Маньчжурия",
        "Шаньсийское государство",
        "Китайская Советская Республика",
        "Республика Гуанси",
        "Сычуаньский конгломерат"
    ]
};

module.exports = async (interaction) => {

    // =========================
    // 📩 КНОПКА ПОДАТЬ ЗАЯВКУ
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
    // 🌍 РЕГИОН
    // =========================
    if (interaction.isStringSelectMenu() && interaction.customId === "region_select") {

        const region = interaction.values[0];
        const list = REGIONS[region];

        const menu = new StringSelectMenuBuilder()
            .setCustomId("country_select")
            .setPlaceholder("🌍 Выберите страну")
            .addOptions(
                list.slice(0, 25).map(c => ({
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
    // 🌍 СТРАНА → ЗАЯВКА
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
                .setCustomId(`approve|${requestId}`)
                .setLabel("🟢 Одобрить")
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId(`reject|${requestId}`)
                .setLabel("🔴 Отказать")
                .setStyle(ButtonStyle.Danger)
        );

        if (channel) {
            await channel.send({ embeds: [embed], components: [row] });
        }

        return interaction.update({
            content: `📋 Заявка отправлена\n🌍 ${countryName}\n📌 На рассмотрении`,
            components: []
        });
    }

    // =========================
    // 🟢 / 🔴 КНОПКИ
    // =========================
    if (interaction.isButton()) {

        const [action, requestId] = interaction.customId.split("|");
        const [userId, countryName] = requestId.split("_");

        const member = await interaction.guild.members.fetch(userId).catch(() => null);

        // 🟢 ОДОБРЕНИЕ
        if (action === "approve") {

            const result = assignCountry(countryName, {
                id: userId,
                username: member?.user.username || "User"
            });

            if (result?.error) {
                return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
            }

            if (member) {
                await member.setNickname(`🌍 | ${member.user.username}`).catch(() => {});
                await member.send(`✅ Заявка одобрена: ${countryName}`).catch(() => {});
            }

            return interaction.reply({ content: "🟢 Одобрено", ephemeral: true });
        }

        // 🔴 ОТКАЗ
        if (action === "reject") {

            if (member) {
                await member.send(`❌ Заявка отклонена: ${countryName}`).catch(() => {});
            }

            return interaction.reply({ content: "🔴 Отклонено", ephemeral: true });
        }
    }
};
