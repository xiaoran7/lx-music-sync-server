"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatisticsEvent = void 0;
const user_1 = require("../../user");
const events_1 = require("events");
class StatisticsEvent extends events_1.EventEmitter {
    statistics_changed() {
        this.emit('statistics_changed');
    }
    /**
     * CRDT 合并传入的统计数据
     * @param userName 用户名
     * @param data 统计数据
     * @param isRemote 是否属于远程操作
     */
    async statistics_data_merge(userName, data, isRemote = false) {
        const userSpace = (0, user_1.getUserSpace)(userName);
        await userSpace.statisticsManage.statisticsDataManage.mergeData(data);
        this.emit('statistics_data_merge', userName, data, isRemote);
    }
    /**
     * 覆盖整个统计数据
     * @param userName 用户名
     * @param data 统计数据
     * @param isRemote 是否属于远程操作
     */
    async statistics_data_overwrite(userName, data, isRemote = false) {
        const userSpace = (0, user_1.getUserSpace)(userName);
        await userSpace.statisticsManage.statisticsDataManage.overwriteData(data);
        this.emit('statistics_data_overwrite', userName, data, isRemote);
    }
}
exports.StatisticsEvent = StatisticsEvent;
