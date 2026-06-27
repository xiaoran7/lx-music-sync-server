import { getUserSpace } from '@/user'
import { EventEmitter } from 'events'

export class StatisticsEvent extends EventEmitter {
  statistics_changed() {
    this.emit('statistics_changed')
  }

  /**
   * CRDT 合并传入的统计数据
   * @param userName 用户名
   * @param data 统计数据
   * @param isRemote 是否属于远程操作
   */
  async statistics_data_merge(userName: string, data: LX.Statistics.StatisticsData, isRemote: boolean = false) {
    const userSpace = getUserSpace(userName)
    await userSpace.statisticsManage.statisticsDataManage.mergeData(data)
    this.emit('statistics_data_merge', userName, data, isRemote)
  }

  /**
   * 覆盖整个统计数据
   * @param userName 用户名
   * @param data 统计数据
   * @param isRemote 是否属于远程操作
   */
  async statistics_data_overwrite(userName: string, data: LX.Statistics.StatisticsData, isRemote: boolean = false) {
    const userSpace = getUserSpace(userName)
    await userSpace.statisticsManage.statisticsDataManage.overwriteData(data)
    this.emit('statistics_data_overwrite', userName, data, isRemote)
  }
}

type EventMethods = Omit<EventType, keyof EventEmitter>
declare class EventType extends StatisticsEvent {
  on<K extends keyof EventMethods>(event: K, listener: EventMethods[K]): this
  once<K extends keyof EventMethods>(event: K, listener: EventMethods[K]): this
  off<K extends keyof EventMethods>(event: K, listener: EventMethods[K]): this
}
export type StatisticsEventType = Omit<EventType, keyof Omit<EventEmitter, 'on' | 'off' | 'once'>>
