const fs = require("fs");

const DB_PATH = "./data/database.json";

// 📖 читаем базу
function readDB() {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

// 💾 сохраняем базу
function saveDB(db) {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

module.exports = {
    readDB,
    saveDB
};
