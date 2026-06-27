import { type UserDataManage } from '@/user'
import { SnapshotDataManage } from './snapshotDataManage'
import { StatisticsDataManage } from './statisticsDataManage'
import { stableStringify } from './merge'
import { toMD5 } from '@/utils'

export class StatisticsManage {
  snapshotDataManage: SnapshotDataManage
  statisticsDataManage: StatisticsDataManage

  constructor(userDataManage: UserDataManage) {
    this.snapshotDataManage = new SnapshotDataManage(userDataManage)
    this.statisticsDataManage = new StatisticsDataManage(this.snapshotDataManage)
  }

  createSnapshot = async() => {
    const data = await this.getData()
    const str = stableStringify(data)
    const md5 = toMD5(str)
    const snapshotInfo = await this.snapshotDataManage.getSnapshotInfo()
    if (snapshotInfo.latest == md5) return md5
    if (snapshotInfo.list.includes(md5)) {
      snapshotInfo.list.splice(snapshotInfo.list.indexOf(md5), 1)
    } else await this.snapshotDataManage.saveSnapshot(md5, str)
    if (snapshotInfo.latest) snapshotInfo.list.unshift(snapshotInfo.latest)
    snapshotInfo.latest = md5
    snapshotInfo.time = Date.now()
    this.snapshotDataManage.saveSnapshotInfo(snapshotInfo)
    return md5
  }

  getCurrentListInfoKey = async() => {
    const snapshotInfo = await this.snapshotDataManage.getSnapshotInfo()
    if (snapshotInfo.latest) return snapshotInfo.latest
    return this.createSnapshot()
  }

  getDeviceCurrentSnapshotKey = async(clientId: string) => {
    return this.snapshotDataManage.getDeviceCurrentSnapshotKey(clientId)
  }

  updateDeviceSnapshotKey = async(clientId: string, key: string) => {
    await this.snapshotDataManage.updateDeviceSnapshotKey(clientId, key)
  }

  removeDevice = async(clientId: string) => {
    this.snapshotDataManage.removeSnapshotInfo(clientId)
  }

  getData = async() => {
    return this.statisticsDataManage.getData()
  }
}
