declare namespace LX {
  namespace Statistics {
    /** 单台设备的统计桶 */
    interface DeviceStatistics {
      /** = dailyStats 求和，派生字段 */
      totalDuration: number
      /** 'Y-M-D'(零填充) -> 秒 */
      dailyStats: Record<string, number>
      /** 音源码 -> 秒 */
      sourceStats: Record<string, number>
      /** 本设备首次使用日期 'Y-M-D' */
      firstUseDate: string
      /** 平台标识，展示用 */
      platform?: string
      /** 设备名，展示用 */
      deviceName?: string
    }

    /** 分桶结构（持久化 + 同步） */
    interface StatisticsData {
      version: 2
      devices: Record<string, DeviceStatistics>
    }
  }
}
