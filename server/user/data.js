"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserDataManage = exports.createClientKeyInfo = exports.deleteUserName = exports.setUserName = exports.getUserName = exports.getUserConfig = exports.getUserDirname = exports.setVersion = exports.getVersion = exports.getServerId = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const node_crypto_1 = require("node:crypto");
const common_1 = require("../utils/common");
const utils_1 = require("../utils");
const constants_1 = require("../constants");
const serverInfoFilePath = node_path_1.default.join(global.lx.dataPath, constants_1.File.serverInfoJSON);
const saveServerInfoThrottle = (0, common_1.throttle)(() => {
    node_fs_1.default.writeFile(serverInfoFilePath, JSON.stringify(serverInfo), 'utf8', (err) => {
        if (err)
            console.error(err);
    });
});
let serverInfo;
if (node_fs_1.default.existsSync(serverInfoFilePath)) {
    serverInfo = JSON.parse(node_fs_1.default.readFileSync(serverInfoFilePath).toString());
}
else {
    serverInfo = {
        serverId: (0, node_crypto_1.randomBytes)(4 * 4).toString('base64'),
        version: 2,
    };
    saveServerInfoThrottle();
}
const getServerId = () => {
    return serverInfo.serverId;
};
exports.getServerId = getServerId;
const getVersion = () => {
    return serverInfo.version ?? 1;
};
exports.getVersion = getVersion;
const setVersion = (version) => {
    serverInfo.version = version;
    saveServerInfoThrottle();
};
exports.setVersion = setVersion;
const getUserDirname = (userName) => `${(0, utils_1.filterFileName)(userName)}_${(0, utils_1.toMD5)(userName).substring(0, 6)}`;
exports.getUserDirname = getUserDirname;
const getUserConfig = (userName) => {
    const user = global.lx.config.users.find(u => u.name == userName);
    if (!user)
        throw new Error('user not found: ' + userName);
    return {
        maxSnapshotNum: global.lx.config.maxSnapshotNum,
        'list.addMusicLocationType': global.lx.config['list.addMusicLocationType'],
        ...user,
    };
};
exports.getUserConfig = getUserConfig;
// 读取所有用户目录下的devicesInfo信息，建立clientId与用户的对应关系，用于非首次连接
const deviceUserMap = new Map();
for (const deviceInfo of node_fs_1.default.readdirSync(global.lx.userPath).map(dirname => {
    const devicesFilePath = node_path_1.default.join(global.lx.userPath, dirname, constants_1.File.userDevicesJSON);
    if (node_fs_1.default.existsSync(devicesFilePath)) {
        const devicesInfo = JSON.parse(node_fs_1.default.readFileSync(devicesFilePath).toString());
        if ((0, exports.getUserDirname)(devicesInfo.userName) == dirname)
            return { userName: devicesInfo.userName, devices: devicesInfo.clients };
    }
    return { userName: '', devices: {} };
})) {
    for (const device of Object.values(deviceInfo.devices)) {
        if (deviceInfo.userName)
            deviceUserMap.set(device.clientId, deviceInfo.userName);
    }
}
const getUserName = (clientId) => {
    if (!clientId)
        return null;
    return deviceUserMap.get(clientId) ?? null;
};
exports.getUserName = getUserName;
const setUserName = (clientId, dir) => {
    deviceUserMap.set(clientId, dir);
};
exports.setUserName = setUserName;
const deleteUserName = (clientId) => {
    deviceUserMap.delete(clientId);
};
exports.deleteUserName = deleteUserName;
const createClientKeyInfo = (deviceName, isMobile) => {
    const keyInfo = {
        clientId: (0, node_crypto_1.randomBytes)(4 * 4).toString('base64'),
        key: (0, node_crypto_1.randomBytes)(16).toString('base64'),
        deviceName,
        isMobile,
        lastConnectDate: 0,
    };
    return keyInfo;
};
exports.createClientKeyInfo = createClientKeyInfo;
class UserDataManage {
    constructor(userName) {
        this.getAllClientKeyInfo = () => {
            return Object.values(this.devicesInfo.clients).sort((a, b) => (b.lastConnectDate ?? 0) - (a.lastConnectDate ?? 0));
        };
        this.saveClientKeyInfo = (keyInfo) => {
            if (this.devicesInfo.clients[keyInfo.clientId] == null && Object.keys(this.devicesInfo.clients).length > 101)
                throw new Error('max keys');
            this.devicesInfo.clients[keyInfo.clientId] = keyInfo;
            this.saveDevicesInfoThrottle();
        };
        this.getClientKeyInfo = (clientId) => {
            if (!clientId)
                return null;
            return this.devicesInfo.clients[clientId] ?? null;
        };
        this.removeClientKeyInfo = async (clientId) => {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete this.devicesInfo.clients[clientId];
            this.saveDevicesInfoThrottle();
        };
        this.isIncluedsClient = (clientId) => {
            return Object.values(this.devicesInfo.clients).some(client => client.clientId == clientId);
        };
        this.userName = userName;
        this.userDir = node_path_1.default.join(global.lx.userPath, (0, exports.getUserDirname)(userName));
        this.devicesFilePath = node_path_1.default.join(this.userDir, constants_1.File.userDevicesJSON);
        this.devicesInfo = node_fs_1.default.existsSync(this.devicesFilePath) ? JSON.parse(node_fs_1.default.readFileSync(this.devicesFilePath).toString()) : { userName, clients: {} };
        this.saveDevicesInfoThrottle = (0, common_1.throttle)(() => {
            node_fs_1.default.writeFile(this.devicesFilePath, JSON.stringify(this.devicesInfo), 'utf8', (err) => {
                if (err)
                    console.error(err);
            });
        });
    }
}
exports.UserDataManage = UserDataManage;
// type UserDataManages = Map<string, UserDataManage>
// export const createUserDataManage = (user: LX.UserConfig) => {
//   const manage = Object.create(userDataManage) as typeof userDataManage
//   manage.userDir = user.dataPath
// }
