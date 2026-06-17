const { readDB, saveDB } = require("./dbService");

// 📌 выдать страну
function assignCountry(country, user) {
    const db = readDB();

    // ❌ страна занята
    if (db.countries[country]) {
        return { error: "Страна уже занята" };
    }

    // ❌ у юзера уже есть страна
    if (db.users[user.id]) {
        return { error: "У тебя уже есть страна" };
    }

    db.countries[country] = user.id;
    db.users[user.id] = country;

    saveDB(db);

    return { success: true, country };
}

// 📌 снять страну
function removeCountry(userId) {
    const db = readDB();

    const country = db.users[userId];

    if (!country) {
        return { error: "У игрока нет страны" };
    }

    delete db.users[userId];
    delete db.countries[country];

    saveDB(db);

    return { success: true, country };
}

// 📌 проверить занята ли страна
function isTaken(country) {
    const db = readDB();
    return !!db.countries[country];
}

// 📌 получить страну пользователя
function getUserCountry(userId) {
    const db = readDB();
    return db.users[userId] || null;
}

module.exports = {
    assignCountry,
    removeCountry,
    isTaken,
    getUserCountry
};
