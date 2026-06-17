const fs = require("fs");

const CONFIG_PATH = "./config/config.json";

function getConfig() {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
}

function saveConfig(config) {
    fs.writeFileSync(
        CONFIG_PATH,
        JSON.stringify(config, null, 2)
    );
}

module.exports = {
    getConfig,
    saveConfig
};
