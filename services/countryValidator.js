const REGIONS = require("../data/regions");
const { readDB, saveDB } = require("./dbService");

// =============================
// COUNTRY VALIDATION SYSTEM V1
// =============================

function normalizeCountry(input) {
    if (!input) return null;
    return input.trim();
}

function isValidCountry(country) {
    const all = Object.values(REGIONS).flat();
    return all.includes(country);
}

function isCountryTaken(country) {
    const db = readDB();
    return !!db.countries?.[country];
}

function canAssignCountry(country) {
    const clean = normalizeCountry(country);

    if (!clean) {
        return { ok: false, error: "Пустая страна" };
    }

    if (!isValidCountry(clean)) {
        return { ok: false, error: "Такой страны нет в системе" };
    }

    if (isCountryTaken(clean)) {
        return { ok: false, error: "Страна уже занята" };
    }

    return { ok: true };
}

module.exports = {
    canAssignCountry,
    isValidCountry,
    isCountryTaken
};
