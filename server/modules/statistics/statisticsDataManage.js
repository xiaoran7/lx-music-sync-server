"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatisticsDataManage = void 0;
const merge_1 = require("./merge");
class StatisticsDataManage {
    constructor(snapshotDataManage) {
        this.data = (0, merge_1.createEmptyStore)();
        this.getData = async () => {
            return this.data;
        };
        /** CRDT 合并：把传入数据并入当前数据，返回合并结果 */
        this.mergeData = async (incoming) => {
            this.data = (0, merge_1.mergeStore)(this.data, incoming);
            return this.data;
        };
        this.overwriteData = async (data) => {
            this.data = data ? (0, merge_1.mergeStore)((0, merge_1.createEmptyStore)(), data) : (0, merge_1.createEmptyStore)();
            return this.data;
        };
        this.snapshotDataManage = snapshotDataManage;
        void this.snapshotDataManage.getSnapshotInfo().then(async (snapshotInfo) => {
            if (snapshotInfo.latest) {
                const str = await this.snapshotDataManage.getSnapshot(snapshotInfo.latest);
                this.data = (0, merge_1.parseStore)(str);
            }
        });
    }
}
exports.StatisticsDataManage = StatisticsDataManage;
