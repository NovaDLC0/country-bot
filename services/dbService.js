const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "data", "db.json");

// =========================
// READ DB
// =========================
function readDB() {
    try {
        const raw = fs.readFileSync(DB_PATH, "utf8");

        const db = JSON.parse(raw);

        return {
            applications: db.applications || {},
            countries: db.countries || {},
            settings: db.settings || {},
            cooldowns: db.cooldowns || {}
        };

    } catch (e) {
        return {
            applications: {},
            countries: {},
            settings: {},
            cooldowns: {}
        };
    }
}

// =========================
// SAVE DB
// =========================
function saveDB(db) {
    const safeDB = {
        applications: db.applications || {},
        countries: db.countries || {},
        settings: db.settings || {},
        cooldowns: db.cooldowns || {}
    };

    fs.writeFileSync(DB_PATH, JSON.stringify(safeDB, null, 2));
}

module.exports = { readDB, saveDB };
