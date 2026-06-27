import { throttle } from '@/utils/common'
import fs from 'node:fs'
import path from 'node:path'
import { syncLog } from '@/utils/log4js'
import { checkAndCreateDirSync } from '@/utils'
import { getUserConfig, type UserDataManage } from '@/user/data'
import { File } from '@/constants'

interface SnapshotInfo {
  latest: string | null
  time: number
  list: string[]
  clients: Record<string, LX.Sync.Statistics.ListInfo>
}
export class SnapshotDataManage {
  userDataManage: UserDataManage
  statisticsDir: string
  snapshotDir: string
  snapshotInfoFilePath: string
  snapshotInfo: SnapshotInfo
  clientSnapshotKeys: string[]
  private readonly saveSnapshotInfoThrottle: () => void

  isIncluedsDevice = (key: string) => {
    return this.clientSnapshotKeys.includes(key)
  }

  clearOldSnapshot = async() => {
    if (!this.snapshotInfo) return
    const snapshotList = this.snapshotInfo.list.filter(key => !this.isIncluedsDevice(key))
    const userMaxSnapshotNum = getUserConfig(this.userDataManage.userName).maxSnapshotNum
    let requiredSave = snapshotList.length > userMaxSnapshotNum
    while (snapshotList.length > userMaxSnapshotNum) {
      const name = snapshotList.pop()
      if (name) {
        await this.removeSnapshot(name)
        this.snapshotInfo.list.splice(this.snapshotInfo.list.indexOf(name), 1)
      } else break
    }
    if (requiredSave) this.saveSnapshotInfo(this.snapshotInfo)
  }

  updateDeviceSnapshotKey = async(clientId: string, key: string) => {
    let client = this.snapshotInfo.clients[clientId]
    if (!client) client = this.snapshotInfo.clients[clientId] = { snapshotKey: '', lastSyncDate: 0 }
    if (client.snapshotKey) this.clientSnapshotKeys.splice(this.clientSnapshotKeys.indexOf(client.snapshotKey), 1)
    client.snapshotKey = key
    client.lastSyncDate = Date.now()
    this.clientSnapshotKeys.push(key)
    this.saveSnapshotInfoThrottle()
  }

  getDeviceCurrentSnapshotKey = async(clientId: string) => {
    const client = this.snapshotInfo.clients[clientId]
    return client?.snapshotKey
  }

  getSnapshotInfo = async(): Promise<SnapshotInfo> => {
    return this.snapshotInfo
  }

  saveSnapshotInfo = (info: SnapshotInfo) => {
    this.snapshotInfo = info
    this.saveSnapshotInfoThrottle()
  }

  removeSnapshotInfo = (clientId: string) => {
    let client = this.snapshotInfo.clients[clientId]
    if (!client) return
    if (client.snapshotKey) this.clientSnapshotKeys.splice(this.clientSnapshotKeys.indexOf(client.snapshotKey), 1)
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete this.snapshotInfo.clients[clientId]
    this.saveSnapshotInfoThrottle()
  }

  getSnapshot = async(name: string) => {
    const filePath = path.join(this.snapshotDir, `snapshot_${name}`)
    let data: string
    try {
      data = (await fs.promises.readFile(filePath)).toString('utf-8')
    } catch (err) {
      syncLog.warn(err)
      return null
    }
    return data
  }

  saveSnapshot = async(name: string, data: string) => {
    syncLog.info('saveSnapshot', this.userDataManage.userName, name)
    const filePath = path.join(this.snapshotDir, `snapshot_${name}`)
    try {
      fs.writeFileSync(filePath, data)
    } catch (err) {
      syncLog.error(err)
      throw err
    }
  }

  removeSnapshot = async(name: string) => {
    syncLog.info('removeSnapshot', this.userDataManage.userName, name)
    const filePath = path.join(this.snapshotDir, `snapshot_${name}`)
    try {
      fs.unlinkSync(filePath)
    } catch (err) {
      syncLog.error(err)
    }
  }

  constructor(userDataManage: UserDataManage) {
    this.userDataManage = userDataManage

    this.statisticsDir = path.join(userDataManage.userDir, File.statisticsDir)
    checkAndCreateDirSync(this.statisticsDir)

    this.snapshotDir = path.join(this.statisticsDir, File.statisticsSnapshotDir)
    checkAndCreateDirSync(this.snapshotDir)

    this.snapshotInfoFilePath = path.join(this.statisticsDir, File.statisticsSnapshotInfoJSON)
    this.snapshotInfo = fs.existsSync(this.snapshotInfoFilePath)
      ? JSON.parse(fs.readFileSync(this.snapshotInfoFilePath).toString())
      : { latest: null, time: 0, list: [], clients: {} }

    this.saveSnapshotInfoThrottle = throttle(() => {
      fs.writeFile(this.snapshotInfoFilePath, JSON.stringify(this.snapshotInfo), 'utf8', (err) => {
        if (err) console.error(err)
        void this.clearOldSnapshot()
      })
    })

    this.clientSnapshotKeys = Object.values(this.snapshotInfo.clients).map(device => device.snapshotKey).filter(k => k)
  }
}
