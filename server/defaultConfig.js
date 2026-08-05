"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    serverName: 'My Sync Server',
    'proxy.enabled': false,
    'proxy.header': 'x-real-ip',
    maxSnapshotNum: 10,
    'list.addMusicLocationType': 'top',
    users: [
    // 用户配置例子
    // {
    //   name: 'user1', // 用户名，必须，不能与其他用户名重复
    //   password: '123.def', // 是连接密码，必须，不能与其他用户密码重复，若在外网，务必增加密码复杂度
    //   maxSnapshotNum: 10, // 可选，最大备份快照数
    //   'list.addMusicLocationType': 'top', // 可选，添加歌曲到我的列表时的位置 top | bottom，参考客户端的「设置 → 列表设置 → 添加歌曲到列表时的位置」
    // },
    ],
};
exports.default = config;
