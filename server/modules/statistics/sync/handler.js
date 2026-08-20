"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// 这个文件导出的方法将暴露给客户端调用，第一个参数固定为当前 socket 对象
const constants_1 = require("../../../constants");
const user_1 = require("../../../user");
const handler = {
    // 客户端推送本地统计变更（CRDT 合并），服务端合并后广播给同用户其他设备
    async onStatisticsSyncAction(socket, action) {
        if (!socket.moduleReadys?.statistics)
            return;
        const userName = socket.userInfo.name;
        await global.event_statistics.statistics_data_merge(userName, action.data, true);
        const userSpace = (0, user_1.getUserSpace)(userName);
        const merged = await userSpace.statisticsManage.getData();
        const key = await userSpace.statisticsManage.createSnapshot();
        await userSpace.statisticsManage.updateDeviceSnapshotKey(socket.keyInfo.clientId, key);
        const currentId = socket.keyInfo.clientId;
        const broadcastAction = { action: 'statistics_data_sync', data: merged };
        socket.broadcast((client) => {
            if (client.keyInfo.clientId == currentId || !client.moduleReadys?.statistics || client.userInfo.name != userName)
                return;
            void client.remoteQueueStatistics.onStatisticsSyncAction(broadcastAction).then(async () => {
                return userSpace.statisticsManage.updateDeviceSnapshotKey(client.keyInfo.clientId, key);
            }).catch(err => {
                client.close(constants_1.SYNC_CLOSE_CODE.failed);
                console.log(err.message);
            });
        });
    },
};
exports.default = handler;
