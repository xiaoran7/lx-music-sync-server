"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatisticsManage = void 0;
const snapshotDataManage_1 = require("./snapshotDataManage");
const statisticsDataManage_1 = require("./statisticsDataManage");
const merge_1 = require("./merge");
const utils_1 = require("../../utils");
class StatisticsManage {
    constructor(userDataManage) {
        this.createSnapshot = async () => {
            const data = await this.getData();
            const str = (0, merge_1.stableStringify)(data);
            const md5 = (0, utils_1.toMD5)(str);
            const snapshotInfo = await this.snapshotDataManage.getSnapshotInfo();
            if (snapshotInfo.latest == md5)
                return md5;
            if (snapshotInfo.list.includes(md5)) {
                snapshotInfo.list.splice(snapshotInfo.list.indexOf(md5), 1);
            }
            else
                await this.snapshotDataManage.saveSnapshot(md5, str);
            if (snapshotInfo.latest)
                snapshotInfo.list.unshift(snapshotInfo.latest);
            snapshotInfo.latest = md5;
            snapshotInfo.time = Date.now();
            this.snapshotDataManage.saveSnapshotInfo(snapshotInfo);
            return md5;
        };
        this.getCurrentListInfoKey = async () => {
            const snapshotInfo = await this.snapshotDataManage.getSnapshotInfo();
            if (snapshotInfo.latest)
                return snapshotInfo.latest;
            return this.createSnapshot();
        };
        this.getDeviceCurrentSnapshotKey = async (clientId) => {
            return this.snapshotDataManage.getDeviceCurrentSnapshotKey(clientId);
        };
        this.updateDeviceSnapshotKey = async (clientId, key) => {
            await this.snapshotDataManage.updateDeviceSnapshotKey(clientId, key);
        };
        this.removeDevice = async (clientId) => {
            this.snapshotDataManage.removeSnapshotInfo(clientId);
        };
        this.getData = async () => {
            return this.statisticsDataManage.getData();
        };
        this.snapshotDataManage = new snapshotDataManage_1.SnapshotDataManage(userDataManage);
        this.statisticsDataManage = new statisticsDataManage_1.StatisticsDataManage(this.snapshotDataManage);
    }
}
exports.StatisticsManage = StatisticsManage;
