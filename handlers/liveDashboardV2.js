const { buildDashboardV2 } = require("./countriesDashboardV2");

// =========================
// LIVE DASHBOARD V2
// =========================

let interval = null;

async function startLiveDashboardV2(channel) {
    // создаём сообщение один раз
    const message = await channel.send({
        embeds: [buildDashboardV2()]
    });

    // очищаем старый интервал если был
    if (interval) clearInterval(interval);

    // автообновление
    interval = setInterval(async () => {
        try {
            await message.edit({
                embeds: [buildDashboardV2()]
            });
        } catch (err) {
            console.log("LIVE DASHBOARD ERROR:", err);
        }
    }, 5000); // 5 секунд

    return message;
}

module.exports = {
    startLiveDashboardV2
};
