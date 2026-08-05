#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const log4js_1 = require("./utils/log4js");
const defaultConfig_1 = __importDefault(require("./defaultConfig"));
const constants_1 = require("./constants");
const utils_1 = require("./utils");
let envParams = {};
let envUsers = [];
const envParamKeys = Object.values(constants_1.ENV_PARAMS).filter(v => v != 'LX_USER_');
{
    const envLog = [
        ...envParamKeys.map(e => [e, process.env[e]]).filter(([k, v]) => {
            if (!v)
                return false;
            envParams[k] = v;
            return true;
        }),
        ...Object.entries(process.env)
            .filter(([k, v]) => {
            if (k.startsWith('LX_USER_') && !!v) {
                const name = k.replace('LX_USER_', '');
                if (name) {
                    envUsers.push({
                        name,
                        password: v,
                    });
                    return true;
                }
            }
            return false;
        }),
    ].map(([e, v]) => `${e}: ${v}`);
    if (envLog.length)
        console.log(`Load env: \n  ${envLog.join('\n  ')}`);
}
const dataPath = envParams.DATA_PATH ?? path_1.default.join(__dirname, '../data');
global.lx = {
    logPath: envParams.LOG_PATH ?? path_1.default.join(__dirname, '../logs'),
    dataPath,
    userPath: path_1.default.join(dataPath, constants_1.File.userDir),
    config: defaultConfig_1.default,
};
const mergeConfigFileEnv = (config) => {
    const envLog = [];
    for (const [k, v] of Object.entries(config).filter(([k]) => k.startsWith('env.'))) {
        const envKey = k.replace('env.', '');
        let value = String(v);
        if (envParamKeys.includes(envKey)) {
            if (envParams[envKey] == null) {
                envLog.push(`${envKey}: ${value}`);
                envParams[envKey] = value;
            }
        }
        else if (envKey.startsWith('LX_USER_') && value) {
            const name = k.replace('LX_USER_', '');
            if (name) {
                envUsers.push({
                    name,
                    password: value,
                });
                envLog.push(`${envKey}: ${value}`);
            }
        }
    }
    if (envLog.length)
        console.log(`Load config file env:\n  ${envLog.join('\n  ')}`);
};
const margeConfig = (p) => {
    let config;
    try {
        config = path_1.default.extname(p) == '.js'
            ? require(p)
            : JSON.parse(fs_1.default.readFileSync(p).toString());
    }
    catch (err) {
        console.warn('Read config error: ' + err.message);
        return false;
    }
    const newConfig = { ...global.lx.config };
    for (const key of Object.keys(defaultConfig_1.default)) {
        // @ts-expect-error
        if (config[key] !== undefined)
            newConfig[key] = config[key];
    }
    console.log('Load config: ' + p);
    if (newConfig.users.length) {
        const users = [];
        for (const user of newConfig.users) {
            users.push({
                ...user,
                dataPath: '',
            });
        }
        newConfig.users = users;
    }
    global.lx.config = newConfig;
    mergeConfigFileEnv(config);
    return true;
};
const p1 = path_1.default.join(__dirname, '../config.js');
fs_1.default.existsSync(p1) && margeConfig(p1);
envParams.CONFIG_PATH && fs_1.default.existsSync(envParams.CONFIG_PATH) && margeConfig(envParams.CONFIG_PATH);
if (envParams.PROXY_HEADER) {
    global.lx.config['proxy.enabled'] = true;
    global.lx.config['proxy.header'] = envParams.PROXY_HEADER;
}
if (envParams.MAX_SNAPSHOT_NUM) {
    const num = parseInt(envParams.MAX_SNAPSHOT_NUM);
    if (!isNaN(num))
        global.lx.config.maxSnapshotNum = num;
}
if (envParams.LIST_ADD_MUSIC_LOCATION_TYPE) {
    switch (envParams.LIST_ADD_MUSIC_LOCATION_TYPE) {
        case 'top':
        case 'bottom':
            global.lx.config['list.addMusicLocationType'] = envParams.LIST_ADD_MUSIC_LOCATION_TYPE;
            break;
    }
}
if (envUsers.length) {
    const users = [];
    let u;
    for (let user of envUsers) {
        let isLikeJSON = true;
        try {
            u = JSON.parse(user.password);
        }
        catch {
            isLikeJSON = false;
        }
        if (isLikeJSON && typeof u == 'object') {
            users.push({
                name: user.name,
                ...u,
                dataPath: '',
            });
        }
        else {
            users.push({
                name: user.name,
                password: user.password,
                dataPath: '',
            });
        }
    }
    global.lx.config.users = users;
}
const exit = (message) => {
    console.error(message);
    process.exit(0);
};
const checkAndCreateDir = (path) => {
    try {
        (0, utils_1.checkAndCreateDirSync)(path);
    }
    catch (e) {
        if (e.code !== 'EEXIST') {
            exit(`Could not set up log directory, error was: ${e.message}`);
        }
    }
};
const checkUserConfig = (users) => {
    const userNames = [];
    const passwords = [];
    for (const user of users) {
        if (userNames.includes(user.name))
            exit('User name duplicate: ' + user.name);
        if (passwords.includes(user.password))
            exit('User password duplicate: ' + user.password);
        userNames.push(user.name);
        passwords.push(user.password);
    }
};
checkAndCreateDir(global.lx.logPath);
checkAndCreateDir(global.lx.dataPath);
checkAndCreateDir(global.lx.userPath);
checkUserConfig(global.lx.config.users);
console.log(`Users:
${global.lx.config.users.map(user => `  ${user.name}: ${user.password}`).join('\n') || '  No User'}
`);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getUserDirname } = require('./user');
for (const user of global.lx.config.users) {
    const dataPath = path_1.default.join(global.lx.userPath, getUserDirname(user.name));
    checkAndCreateDir(dataPath);
    user.dataPath = dataPath;
}
(0, log4js_1.initLogger)();
/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
    const port = parseInt(val, 10);
    if (isNaN(port) || port < 1) {
        // named pipe
        exit(`port illegal: ${val}`);
    }
    return port;
}
/**
 * Get port from environment and store in Express.
 */
const port = normalizePort(envParams.PORT ?? '9527');
const bindIP = envParams.BIND_IP ?? '127.0.0.1';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createModuleEvent } = require('./event');
createModuleEvent();
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('./utils/migrate').default(global.lx.dataPath, global.lx.userPath);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { startServer } = require('./server');
startServer(port, bindIP);
