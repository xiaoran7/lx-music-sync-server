"use strict";
// 听歌统计 合并逻辑（与移动端 src/core/init/player/statisticsMerge.ts 同源）
//
// 按设备分桶的状态型 CRDT：同一设备多副本合并逐键取 max（幂等可交换，重复同步不串数），
// firstUseDate 取 min，totalDuration 由 dailyStats 求和派生。
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseStore = exports.stableStringify = exports.mergeStore = exports.createEmptyStore = exports.normalizeDevice = void 0;
const sumValues = (rec) => {
    let sum = 0;
    for (const k in rec)
        sum += rec[k];
    return sum;
};
const minDate = (a, b) => {
    if (!a)
        return b;
    if (!b)
        return a;
    return a <= b ? a : b; // 'Y-M-D' 零填充，字典序即时间序
};
const maxCounters = (a = {}, b = {}) => {
    const out = {};
    for (const k in a)
        out[k] = a[k];
    for (const k in b) {
        if (out[k] == null || b[k] > out[k])
            out[k] = b[k];
    }
    return out;
};
const pickLabels = (a, b) => {
    const platform = b?.platform ?? a.platform;
    const deviceName = b?.deviceName ?? a.deviceName;
    const out = {};
    if (platform)
        out.platform = platform;
    if (deviceName)
        out.deviceName = deviceName;
    return out;
};
const normalizeDevice = (d) => {
    const dailyStats = d.dailyStats ?? {};
    const sourceStats = d.sourceStats ?? {};
    return {
        totalDuration: sumValues(dailyStats),
        dailyStats,
        sourceStats,
        firstUseDate: d.firstUseDate || '',
        ...pickLabels(d),
    };
};
exports.normalizeDevice = normalizeDevice;
const mergeDevice = (a, b) => {
    if (!a)
        return (0, exports.normalizeDevice)(b);
    if (!b)
        return (0, exports.normalizeDevice)(a);
    const dailyStats = maxCounters(a.dailyStats, b.dailyStats);
    return {
        totalDuration: sumValues(dailyStats),
        dailyStats,
        sourceStats: maxCounters(a.sourceStats, b.sourceStats),
        firstUseDate: minDate(a.firstUseDate, b.firstUseDate),
        ...pickLabels(a, b),
    };
};
const createEmptyStore = () => ({ version: 2, devices: {} });
exports.createEmptyStore = createEmptyStore;
const mergeStore = (a, b) => {
    const aDev = a?.devices ?? {};
    const bDev = b?.devices ?? {};
    const devices = {};
    const ids = new Set([...Object.keys(aDev), ...Object.keys(bDev)]);
    for (const id of ids)
        devices[id] = mergeDevice(aDev[id], bDev[id]);
    return { version: 2, devices };
};
exports.mergeStore = mergeStore;
/** 规范化序列化（设备 id / 日期 / 音源 key 全排序），用于跨端一致的 MD5 */
const stableStringify = (store) => {
    const sortRecord = (rec) => {
        const out = {};
        for (const k of Object.keys(rec).sort())
            out[k] = rec[k];
        return out;
    };
    const obj = { version: 2, devices: {} };
    for (const id of Object.keys(store.devices).sort()) {
        const d = store.devices[id];
        obj.devices[id] = {
            totalDuration: d.totalDuration,
            firstUseDate: d.firstUseDate,
            platform: d.platform ?? '',
            deviceName: d.deviceName ?? '',
            dailyStats: sortRecord(d.dailyStats ?? {}),
            sourceStats: sortRecord(d.sourceStats ?? {}),
        };
    }
    return JSON.stringify(obj);
};
exports.stableStringify = stableStringify;
/** 解析持久化字符串为 store（容错） */
const parseStore = (str) => {
    if (!str)
        return (0, exports.createEmptyStore)();
    try {
        const data = JSON.parse(str);
        if (data?.version == 2 && data.devices) {
            const devices = {};
            for (const id in data.devices)
                devices[id] = (0, exports.normalizeDevice)(data.devices[id]);
            return { version: 2, devices };
        }
    }
    catch { }
    return (0, exports.createEmptyStore)();
};
exports.parseStore = parseStore;
