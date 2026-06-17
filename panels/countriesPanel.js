const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

function buildCountriesPanel() {

    const embed = new EmbedBuilder()
        .setTitle("🌍 Регистрация государств")
        .setDescription(
            [
                "Добро пожаловать в систему регистрации государств.",
                "",
                "Нажмите кнопку ниже для подачи заявки.",
                "",
                "После одобрения заявки страна автоматически закрепится за вами."
            ].join("\n")
        )
        .setColor("Blue");

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("apply_country")
                .setLabel("📩 Подать заявку")
                .setStyle(ButtonStyle.Primary)
        );

    return {
        embeds: [embed],
        components: [row]
    };
}

module.exports = {
    buildCountriesPanel
};
