const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    StringSelectMenuBuilder
} = require("discord.js");

const { readDB, saveDB } = require("../services/dbService");

// =========================
// INIT EMBEDS DB
// =========================
function getEmbedsDB(db) {
    db.embeds = db.embeds || {};

    for (let i = 1; i <= 9; i++) {
        if (!db.embeds[i]) {
            db.embeds[i] = {
                title: "",
                description: "",
                color: "#3498db",
                footer: "",
                thumbnail: "",
                image: "",
                channelId: null
            };
        }
    }

    return db.embeds;
}

// =========================
// MAIN COMMAND !embeds
// =========================
module.exports = async (message) => {

    if (!message.content.startsWith("!embeds")) return;
    if (!message.member.permissions.has("Administrator")) {
        return message.reply("❌ Нет прав");
    }

    const db = readDB();
    const embeds = getEmbedsDB(db);

    const menu = new StringSelectMenuBuilder()
        .setCustomId("embed_select")
        .setPlaceholder("📦 Выберите Embed слот")
        .addOptions(
            Object.keys(embeds).map(id => ({
                label: `Embed #${id}`,
                value: id
            }))
        );

    const row = new ActionRowBuilder().addComponents(menu);

    const embed = new EmbedBuilder()
        .setTitle("📦 Embed Builder")
        .setColor(0x2ecc71)
        .setDescription("Выберите один из 9 слотов");

    return message.channel.send({
        embeds: [embed],
        components: [row]
    });
};

// =========================
// INTERACTIONS
// =========================
module.exports.interaction = async (interaction) => {

    const db = readDB();
    const embeds = getEmbedsDB(db);

    // =========================
    // SELECT EMBED SLOT
    // =========================
    if (interaction.isStringSelectMenu() && interaction.customId === "embed_select") {

        const id = interaction.values[0];
        const data = embeds[id];

        const embed = new EmbedBuilder()
            .setTitle(`📦 Embed #${id}`)
            .setColor(data.color || "#3498db")
            .setDescription(data.description || "Пусто");

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`emb_title_${id}`)
                .setLabel("Title")
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId(`emb_desc_${id}`)
                .setLabel("Description")
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId(`emb_color_${id}`)
                .setLabel("Color")
                .setStyle(ButtonStyle.Primary)
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`emb_footer_${id}`)
                .setLabel("Footer")
                .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId(`emb_thumb_${id}`)
                .setLabel("Thumbnail")
                .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId(`emb_image_${id}`)
                .setLabel("Image")
                .setStyle(ButtonStyle.Secondary)
        );

        const row3 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`emb_preview_${id}`)
                .setLabel("Preview")
                .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId(`emb_publish_${id}`)
                .setLabel("Publish")
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId(`emb_channel_${id}`)
                .setLabel("📺 Канал")
                .setStyle(ButtonStyle.Secondary)
        );

        return interaction.update({
            embeds: [embed],
            components: [row1, row2, row3]
        });
    }

    // =========================
    // MODALS OPEN
    // =========================
    const openModal = (id, title, label, customId) => {
        const modal = new ModalBuilder()
            .setCustomId(customId)
            .setTitle(title);

        const input = new TextInputBuilder()
            .setCustomId("value")
            .setLabel(label)
            .setStyle(TextInputStyle.Short);

        modal.addComponents(new ActionRowBuilder().addComponents(input));

        return interaction.showModal(modal);
    };

    if (interaction.isButton() && interaction.customId.startsWith("emb_title_")) {
        const id = interaction.customId.split("_")[2];
        return openModal(id, "Edit Title", "Title", `emb_save_title_${id}`);
    }

    if (interaction.isButton() && interaction.customId.startsWith("emb_desc_")) {
        const id = interaction.customId.split("_")[2];
        return openModal(id, "Edit Description", "Description", `emb_save_desc_${id}`);
    }

    if (interaction.isButton() && interaction.customId.startsWith("emb_color_")) {
        const id = interaction.customId.split("_")[2];
        return openModal(id, "Edit Color", "#HEX", `emb_save_color_${id}`);
    }

    if (interaction.isButton() && interaction.customId.startsWith("emb_footer_")) {
        const id = interaction.customId.split("_")[2];
        return openModal(id, "Edit Footer", "Footer", `emb_save_footer_${id}`);
    }

    if (interaction.isButton() && interaction.customId.startsWith("emb_thumb_")) {
        const id = interaction.customId.split("_")[2];
        return openModal(id, "Thumbnail URL", "URL", `emb_save_thumb_${id}`);
    }

    if (interaction.isButton() && interaction.customId.startsWith("emb_image_")) {
        const id = interaction.customId.split("_")[2];
        return openModal(id, "Image URL", "URL", `emb_save_image_${id}`);
    }

    // =========================
    // SAVE MODALS
    // =========================
    if (interaction.isModalSubmit() && interaction.customId.startsWith("emb_save_")) {

        const parts = interaction.customId.split("_");
        const type = parts[2];
        const id = parts[3];

        const value = interaction.fields.getTextInputValue("value");

        const db2 = readDB();
        const embeds2 = getEmbedsDB(db2);

        if (type === "title") embeds2[id].title = value;
        if (type === "desc") embeds2[id].description = value;
        if (type === "color") embeds2[id].color = value;
        if (type === "footer") embeds2[id].footer = value;
        if (type === "thumb") embeds2[id].thumbnail = value;
        if (type === "image") embeds2[id].image = value;

        saveDB(db2);

        return interaction.reply({
            content: `✅ Saved ${type}`,
            flags: 64
        });
    }

    // =========================
    // PREVIEW
    // =========================
    if (interaction.isButton() && interaction.customId.startsWith("emb_preview_")) {

        const id = interaction.customId.split("_")[2];
        const data = embeds[id];

        const preview = new EmbedBuilder()
            .setTitle(data.title || "No title")
            .setDescription(data.description || "No description")
            .setColor(data.color || "#3498db")
            .setFooter({ text: data.footer || "" })
            .setThumbnail(data.thumbnail || null)
            .setImage(data.image || null);

        return interaction.reply({
            embeds: [preview],
            flags: 64
        });
    }

    // =========================
    // PUBLISH
    // =========================
    if (interaction.isButton() && interaction.customId.startsWith("emb_publish_")) {

        const id = interaction.customId.split("_")[2];
        const data = embeds[id];

        if (!data.channelId) {
            return interaction.reply({
                content: "❌ Канал не выбран",
                flags: 64
            });
        }

        const channel = await interaction.client.channels.fetch(data.channelId).catch(() => null);

        if (!channel) {
            return interaction.reply({
                content: "❌ Канал не найден",
                flags: 64
            });
        }

        const embed = new EmbedBuilder()
            .setTitle(data.title || "")
            .setDescription(data.description || "")
            .setColor(data.color || "#3498db")
            .setFooter({ text: data.footer || "" })
            .setThumbnail(data.thumbnail || null)
            .setImage(data.image || null);

        await channel.send({ embeds: [embed] });

        return interaction.reply({
            content: "🚀 Опубликовано",
            flags: 64
        });
    }

};
