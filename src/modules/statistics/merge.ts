// 听歌统计 合并逻辑（与移动端 src/core/init/player/statisticsMerge.ts 同源）
//
// 按设备分桶的状态型 CRDT：同一设备多副本合并逐键取 max（幂等可交换，重复同步不串数），
// firstUseDate 取 min，totalDuration 由 dailyStats 求和派生。

type StatisticsData = LX.Statistics.StatisticsData
type DeviceStatistics = LX.Statistics.DeviceStatistics

const sumValues = (rec: Record<string, number>): number => {
  let sum = 0
  for (const k in rec) sum += rec[k]
  return sum
}

const minDate = (a: string, b: string): string => {
  if (!a) return b
  if (!b) return a
  return a <= b ? a : b // 'Y-M-D' 零填充，字典序即时间序
}

const maxCounters = (a: Record<string, number> = {}, b: Record<string, number> = {}): Record<string, number> => {
  const out: Record<string, number> = {}
  for (const k in a) out[k] = a[k]
  for (const k in b) {
    if (out[k] == null || b[k] > out[k]) out[k] = b[k]
  }
  return out
}

const pickLabels = (a: DeviceStatistics, b?: DeviceStatistics): Pick<DeviceStatistics, 'platform' | 'deviceName'> => {
  const platform = b?.platform ?? a.platform
  const deviceName = b?.deviceName ?? a.deviceName
  const out: Pick<DeviceStatistics, 'platform' | 'deviceName'> = {}
  if (platform) out.platform = platform
  if (deviceName) out.deviceName = deviceName
  return out
}

export const normalizeDevice = (d: DeviceStatistics): DeviceStatistics => {
  const dailyStats = d.dailyStats ?? {}
  const sourceStats = d.sourceStats ?? {}
  return {
    totalDuration: sumValues(dailyStats),
    dailyStats,
    sourceStats,
    firstUseDate: d.firstUseDate || '',
    ...pickLabels(d),
  }
}

const mergeDevice = (a?: DeviceStatistics, b?: DeviceStatistics): DeviceStatistics => {
  if (!a) return normalizeDevice(b!)
  if (!b) return normalizeDevice(a)
  const dailyStats = maxCounters(a.dailyStats, b.dailyStats)
  return {
    totalDuration: sumValues(dailyStats),
    dailyStats,
    sourceStats: maxCounters(a.sourceStats, b.sourceStats),
    firstUseDate: minDate(a.firstUseDate, b.firstUseDate),
    ...pickLabels(a, b),
  }
}

export const createEmptyStore = (): StatisticsData => ({ version: 2, devices: {} })

export const mergeStore = (a: StatisticsData | null, b: StatisticsData | null): StatisticsData => {
  const aDev = a?.devices ?? {}
  const bDev = b?.devices ?? {}
  const devices: Record<string, DeviceStatistics> = {}
  const ids = new Set([...Object.keys(aDev), ...Object.keys(bDev)])
  for (const id of ids) devices[id] = mergeDevice(aDev[id], bDev[id])
  return { version: 2, devices }
}

/** 规范化序列化（设备 id / 日期 / 音源 key 全排序），用于跨端一致的 MD5 */
export const stableStringify = (store: StatisticsData): string => {
  const sortRecord = (rec: Record<string, number>): Record<string, number> => {
    const out: Record<string, number> = {}
    for (const k of Object.keys(rec).sort()) out[k] = rec[k]
    return out
  }
  const obj: any = { version: 2, devices: {} }
  for (const id of Object.keys(store.devices).sort()) {
    const d = store.devices[id]
    obj.devices[id] = {
      totalDuration: d.totalDuration,
      firstUseDate: d.firstUseDate,
      platform: d.platform ?? '',
      deviceName: d.deviceName ?? '',
      dailyStats: sortRecord(d.dailyStats ?? {}),
      sourceStats: sortRecord(d.sourceStats ?? {}),
    }
  }
  return JSON.stringify(obj)
}

/** 解析持久化字符串为 store（容错） */
export const parseStore = (str: string | null): StatisticsData => {
  if (!str) return createEmptyStore()
  try {
    const data = JSON.parse(str) as StatisticsData
    if (data?.version == 2 && data.devices) {
      const devices: Record<string, DeviceStatistics> = {}
      for (const id in data.devices) devices[id] = normalizeDevice(data.devices[id])
      return { version: 2, devices }
    }
  } catch {}
  return createEmptyStore()
}
