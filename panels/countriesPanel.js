const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

function buildCountriesPanel() {

    const embed = new EmbedBuilder()
        .setTitle("🌍 Система регистрации государств")
        .setDescription(
            [
                "Добро пожаловать!",
                "",
                "Нажмите кнопку ниже чтобы начать:",
                "",
                "📌 Вы сможете:",
                "🌍 выбрать страну",
                "📝 заполнить анкету",
                "📋 отправить заявку"
            ].join("\n")
        )
        .setColor("Blue");

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("start_country_flow")
            .setLabel("📩 Начать")
            .setStyle(ButtonStyle.Primary)
    );

    return {
        embeds: [embed],
        components: [row]
    };
}

module.exports = { buildCountriesPanel };
