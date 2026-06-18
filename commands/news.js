const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("news")
        .setDescription("📰 Отправить новость от бота")
        .addStringOption(option =>
            option
                .setName("text")
                .setDescription("Текст новости")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {

        const text = interaction.options.getString("text");

        const embed = new EmbedBuilder()
            .setTitle("📰 Новости")
            .setDescription(text)
            .setColor("Gold")
            .setFooter({ text: `От: ${interaction.user.tag}` })
            .setTimestamp();

        await interaction.reply({
            content: "✅ Новость отправлена",
            ephemeral: true
        });

        await interaction.channel.send({ embeds: [embed] });
    }
};
