"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sync = void 0;
const constants_1 = require("../../../constants");
const user_1 = require("../../../user");
let syncingId = null;
const wait = async (time = 1000) => await new Promise((resolve) => setTimeout(resolve, time));
const finishedSync = async (socket) => {
    await socket.remoteQueueStatistics.statistics_sync_finished();
};
const syncStatistics = async (socket) => {
    if (!socket.feature.statistics)
        throw new Error('statistics feature options not available');
    const userName = socket.userInfo.name;
    const userSpace = (0, user_1.getUserSpace)(userName);
    const clientId = socket.keyInfo.clientId;
    // 取客户端全量统计 -> CRDT 合并进服务端
    const remote = await socket.remoteQueueStatistics.statistics_sync_get_data();
    await global.event_statistics.statistics_data_merge(userName, remote, true);
    const merged = await userSpace.statisticsManage.getData();
    const key = await userSpace.statisticsManage.createSnapshot();
    // 把合并结果推回本客户端
    await socket.remoteQueueStatistics.statistics_sync_set_data(merged);
    await userSpace.statisticsManage.updateDeviceSnapshotKey(clientId, key);
    // 广播给同用户其他在线设备
    const broadcastAction = { action: 'statistics_data_sync', data: merged };
    socket.broadcast((client) => {
        if (client.keyInfo.clientId == clientId || !client.moduleReadys?.statistics || client.userInfo.name != userName)
            return;
        void client.remoteQueueStatistics.onStatisticsSyncAction(broadcastAction).then(async () => {
            return userSpace.statisticsManage.updateDeviceSnapshotKey(client.keyInfo.clientId, key);
        }).catch(err => {
            client.close(constants_1.SYNC_CLOSE_CODE.failed);
            console.log(err.message);
        });
    });
};
const sync = async (socket) => {
    let disconnected = false;
    socket.onClose(() => {
        disconnected = true;
        if (syncingId == socket.keyInfo.clientId)
            syncingId = null;
    });
    while (true) {
        if (disconnected)
            throw new Error('disconnected');
        if (!syncingId)
            break;
        await wait();
    }
    syncingId = socket.keyInfo.clientId;
    await syncStatistics(socket).then(async () => {
        await finishedSync(socket);
        socket.moduleReadys.statistics = true;
    }).finally(() => {
        syncingId = null;
    });
};
exports.sync = sync;
