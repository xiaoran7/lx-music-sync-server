"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.releaseUserSpace = exports.getUserSpace = void 0;
const data_1 = require("./data");
const modules_1 = require("../modules");
const users = new Map();
const delayTime = 10 * 1000;
const delayReleaseTimeouts = new Map();
const clearDelayReleaseTimeout = (userName) => {
    if (!delayReleaseTimeouts.has(userName))
        return;
    clearTimeout(delayReleaseTimeouts.get(userName));
    delayReleaseTimeouts.delete(userName);
};
const seartDelayReleaseTimeout = (userName) => {
    clearDelayReleaseTimeout(userName);
    delayReleaseTimeouts.set(userName, setTimeout(() => {
        users.delete(userName);
    }, delayTime));
};
const getUserSpace = (userName) => {
    clearDelayReleaseTimeout(userName);
    let user = users.get(userName);
    if (!user) {
        console.log('new user data manage:', userName);
        const dataManage = new data_1.UserDataManage(userName);
        const listManage = new modules_1.ListManage(dataManage);
        const dislikeManage = new modules_1.DislikeManage(dataManage);
        const statisticsManage = new modules_1.StatisticsManage(dataManage);
        users.set(userName, user = {
            dataManage,
            listManage,
            dislikeManage,
            statisticsManage,
            async getDecices() {
                return this.dataManage.getAllClientKeyInfo();
            },
            async removeDevice(clientId) {
                await listManage.removeDevice(clientId);
                await statisticsManage.removeDevice(clientId);
                await dataManage.removeClientKeyInfo(clientId);
            },
        });
    }
    return user;
};
exports.getUserSpace = getUserSpace;
const releaseUserSpace = (userName, force = false) => {
    if (force) {
        clearDelayReleaseTimeout(userName);
        users.delete(userName);
    }
    else
        seartDelayReleaseTimeout(userName);
};
exports.releaseUserSpace = releaseUserSpace;
__exportStar(require("./data"), exports);
