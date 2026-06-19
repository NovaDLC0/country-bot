const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

function buildCountriesPanel() {

    const embed = new EmbedBuilder()
        .setTitle("🌍 Добро пожаловать в ВПИ")
        .setDescription(
            [
                "Добро пожаловать в ВПИ — мир, где каждое решение влияет на историю.",
                "",
                "Здесь вы станете правителем одного из существующих государств, будете развивать экономику, укреплять армию, вести дипломатию и участвовать в мировых событиях.",
                "",
                "🤝 Мы стремимся поддерживать честную и интересную игру для всех участников.",
                "",
                "📋 Для регистрации:",
                "• Ознакомьтесь с правилами сервера",
                "• Выберите свободное государство",
                "• Нажмите кнопку ниже",
                "• Заполните анкету",
                "• Дождитесь одобрения заявки",
                "",
                "⚠️ Важно:",
                "• Одно государство может принадлежать только одному игроку",
                "• Администрация может отказать в выборе государства",
                "• Соблюдайте правила сервера",
                "",
                "🌎 История не ждёт. Выберите своё государство и оставьте след в мире ВПИ."
            ].join("\n")
        )
        .setColor("#3498db")
        .setFooter({
            text: "ВПИ • World Wide"
        });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("start_country_flow")
            .setLabel("🌍 Зарегистрироваться")
            .setStyle(ButtonStyle.Success)
    );

    return {
        embeds: [embed],
        components: [row]
    };
}

module.exports = {
    buildCountriesPanel
};
