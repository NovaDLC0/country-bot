const { EmbedBuilder } = require("discord.js");
const { getConfig } = require("./configService");

const cooldowns = new Map(); // userId -> timestamp
const accepted = new Map();   // userId -> true

const COOLDOWN = 60 * 60 * 1000; // 1 час

module.exports = async (interaction) => {
    const config = getConfig();

    // =========================
    // 🚫 ЗАЩИТА ОТ ПОВТОРНОЙ ЗАЯВКИ
    // =========================
    if (interaction.isStringSelectMenu() && interaction.customId === "country_select") {

        const countryName = interaction.values[0];

        // ❌ если уже одобрен
        if (accepted.get(interaction.user.id)) {
            return interaction.reply({
                content: "❌ У вас уже есть одобренная заявка.",
                ephemeral: true
            });
        }

        // ⏱ cooldown
        const last = cooldowns.get(interaction.user.id);
        if (last && Date.now() - last < COOLDOWN) {
            const left = Math.ceil((COOLDOWN - (Date.now() - last)) / 60000);

            return interaction.reply({
                content: `⏳ Подождите ${left} мин перед новой заявкой.`,
                ephemeral: true
            });
        }

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

        const row = new (require("discord.js").ActionRowBuilder)().addComponents(
            new (require("discord.js").ButtonBuilder)()
                .setCustomId(`approve|${requestId}`)
                .setLabel("🟢 Одобрить")
                .setStyle(require("discord.js").ButtonStyle.Success),

            new (require("discord.js").ButtonBuilder)()
                .setCustomId(`reject|${requestId}`)
                .setLabel("🔴 Отказать")
                .setStyle(require("discord.js").ButtonStyle.Danger)
        );

        if (channel) {
            await channel.send({ embeds: [embed], components: [row] });
        }

        cooldowns.set(interaction.user.id, Date.now());

        // 📊 лог
        const logChannel = interaction.client.channels.cache.get(config.logChannel);
        if (logChannel) {
            logChannel.send(`📩 Заявка: <@${interaction.user.id}> → **${countryName}**`);
        }

        return interaction.update({
            content: `📋 Заявка отправлена\n🌍 ${countryName}\n📌 На рассмотрении`,
            components: []
        });
    }

    // =========================
    // 🟢 / 🔴 APPROVE / REJECT
    // =========================
    if (
        interaction.isButton() &&
        (interaction.customId.startsWith("approve|") ||
         interaction.customId.startsWith("reject|"))
    ) {

        const [action, requestId] = interaction.customId.split("|");
        const [userId, countryName] = requestId.split("_");

        const member = await interaction.guild.members.fetch(userId).catch(() => null);

        const logChannel = interaction.client.channels.cache.get(config.logChannel);

        // 🟢 APPROVE
        if (action === "approve") {

            accepted.set(userId, true);

            if (member) {
                await member.setNickname(`🌍 | ${member.user.username}`).catch(() => {});
                await member.send(`✅ Заявка одобрена: ${countryName}`).catch(() => {});
            }

            if (logChannel) {
                logChannel.send(`🟢 APPROVED: <@${userId}> → **${countryName}**`);
            }

            return interaction.reply({ content: "🟢 Одобрено", ephemeral: true });
        }

        // 🔴 REJECT
        if (action === "reject") {

            if (member) {
                await member.send(`❌ Заявка отклонена: ${countryName}`).catch(() => {});
            }

            if (logChannel) {
                logChannel.send(`🔴 REJECTED: <@${userId}> → **${countryName}**`);
            }

            return interaction.reply({ content: "🔴 Отклонено", ephemeral: true });
        }
    }
};
