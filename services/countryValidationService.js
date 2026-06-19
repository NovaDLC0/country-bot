const REGIONS = require("../data/regions");

// =========================
// FLATTEN COUNTRIES CACHE
// =========================
let CACHE = null;

function buildCache() {
    const all = Object.values(REGIONS).flat();
    CACHE = new Set(all.map(c => c.toLowerCase()));
    return CACHE;
}

// =========================
// GET ALL COUNTRIES
// =========================
function getAllCountries() {
    if (!CACHE) buildCache();
    return CACHE;
}

// =========================
// CHECK EXISTS COUNTRY
// =========================
function isValidCountry(country) {
    if (!country) return false;

    const list = getAllCountries();
    return list.has(country.toLowerCase());
}

// =========================
// NORMALIZE COUNTRY NAME
// =========================
function normalizeCountry(country) {
    if (!country) return null;

    return country
        .trim()
        .replace(/\s+/g, " ");
}

// =========================
// SAFE CHECK FOR DB WRITE
// =========================
function validateCountryOrThrow(country) {
    const norm = normalizeCountry(country);

    if (!isValidCountry(norm)) {
        return {
            ok: false,
            error: `❌ Страна "${country}" не существует в системе`
        };
    }

    return {
        ok: true,
        country: norm
    };
}

// =========================
// CHECK IF TAKEN
// =========================
function isTaken(db, country) {
    db.countries = db.countries || {};
    return Boolean(db.countries[country]);
}

// =========================
// EXPORTS
// =========================
module.exports = {
    isValidCountry,
    normalizeCountry,
    validateCountryOrThrow,
    isTaken,
    getAllCountries
};
