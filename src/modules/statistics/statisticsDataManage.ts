import { type SnapshotDataManage } from './snapshotDataManage'
import { createEmptyStore, mergeStore, parseStore } from './merge'

export class StatisticsDataManage {
  snapshotDataManage: SnapshotDataManage
  data: LX.Statistics.StatisticsData = createEmptyStore()

  constructor(snapshotDataManage: SnapshotDataManage) {
    this.snapshotDataManage = snapshotDataManage

    void this.snapshotDataManage.getSnapshotInfo().then(async(snapshotInfo) => {
      if (snapshotInfo.latest) {
        const str = await this.snapshotDataManage.getSnapshot(snapshotInfo.latest)
        this.data = parseStore(str)
      }
    })
  }

  getData = async(): Promise<LX.Statistics.StatisticsData> => {
    return this.data
  }

  /** CRDT 合并：把传入数据并入当前数据，返回合并结果 */
  mergeData = async(incoming: LX.Statistics.StatisticsData | null) => {
    this.data = mergeStore(this.data, incoming)
    return this.data
  }

  overwriteData = async(data: LX.Statistics.StatisticsData | null) => {
    this.data = data ? mergeStore(createEmptyStore(), data) : createEmptyStore()
    return this.data
  }
}
