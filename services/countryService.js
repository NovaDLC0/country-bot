const { readDB, saveDB } = require("./dbService");

// 📌 выдать страну
function assignCountry(country, user) {

    const db = readDB();

    db.users = db.users || {};
    db.countries = db.countries || {};

    // страна занята
    if (db.countries[country]) {
        return { error: "Страна уже занята" };
    }

    // у пользователя уже есть страна
    if (db.users[user.id]) {
        return { error: "У тебя уже есть страна" };
    }

    db.countries[country] = user.id;
    db.users[user.id] = country;

    saveDB(db);

    return {
        success: true,
        country
    };
}

// 📌 снять страну
function removeCountry(userId) {

    const db = readDB();

    db.users = db.users || {};
    db.countries = db.countries || {};

    const country = db.users[userId];

    if (!country) {
        return {
            error: "У игрока нет страны"
        };
    }

    delete db.users[userId];
    delete db.countries[country];

    saveDB(db);

    return {
        success: true,
        country
    };
}

// 📌 страна занята?
function isTaken(country) {

    const db = readDB();

    db.countries = db.countries || {};

    return !!db.countries[country];
}

// 📌 страна игрока
function getUserCountry(userId) {

    const db = readDB();

    db.users = db.users || {};

    return db.users[userId] || null;
}

module.exports = {
    assignCountry,
    removeCountry,
    isTaken,
    getUserCountry
};
