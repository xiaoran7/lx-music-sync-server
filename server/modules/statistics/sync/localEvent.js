"use strict";
// 统计变更通过客户端主动 push（onStatisticsSyncAction）触发同步，
// 服务端无需像列表那样监听本地操作再下发，这里留空占位以与其他模块结构一致。
Object.defineProperty(exports, "__esModule", { value: true });
exports.unregisterEvent = exports.registerEvent = void 0;
const registerEvent = (wss) => {
};
exports.registerEvent = registerEvent;
const unregisterEvent = () => {
};
exports.unregisterEvent = unregisterEvent;
