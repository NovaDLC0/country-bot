const REGIONS = require("../data/regions");
const { readDB, saveDB } = require("./dbService");

// =========================
// ALL COUNTRIES CACHE
// =========================
function getAllCountries() {
    return [...new Set(Object.values(REGIONS).flat())];
}

// =========================
// NORMALIZE
// =========================
function normalizeCountry(name) {
    return (name || "").trim();
}

// =========================
// VALIDATION
// =========================
function isValidCountry(country) {
    return getAllCountries().includes(country);
}

// =========================
// ASSIGN COUNTRY
// =========================
function assignCountry(country, user) {

    const db = readDB();

    db.countries = db.countries || {};

    country = normalizeCountry(country);

    if (!isValidCountry(country)) {
        return { error: "❌ Такой страны не существует" };
    }

    if (db.countries[country]) {
        return { error: "❌ Страна уже занята" };
    }

    // remove old country if exists
    for (const [c, owner] of Object.entries(db.countries)) {
        if (owner === user.id) {
            delete db.countries[c];
        }
    }

    db.countries[country] = user.id;

    saveDB(db);

    return { success: true };
}

// =========================
// REMOVE COUNTRY
// =========================
function removeCountry(userId) {

    const db = readDB();

    db.countries = db.countries || {};

    let found = false;

    for (const [country, owner] of Object.entries(db.countries)) {
        if (owner === userId) {
            delete db.countries[country];
            found = true;
        }
    }

    saveDB(db);

    if (!found) {
        return { error: "❌ У пользователя нет страны" };
    }

    return { success: true };
}

module.exports = {
    assignCountry,
    removeCountry,
    getAllCountries,
    isValidCountry,
    normalizeCountry
};
