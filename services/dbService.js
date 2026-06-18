const fs = require("fs");

const DB_PATH = "./data/database.json";

function readDB() {
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify({
            countries: {},
            warns: {},
            accepted: {}
        }, null, 2));
    }

    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function saveDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = { readDB, saveDB };
