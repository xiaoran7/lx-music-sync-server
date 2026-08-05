"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeDevice = exports.getDevices = exports.getStatus = exports.startServer = void 0;
const node_http_1 = __importDefault(require("node:http"));
const ws_1 = require("ws");
const sync_1 = require("./sync");
const auth_1 = require("./auth");
const tools_1 = require("../utils/tools");
const log4js_1 = require("../utils/log4js");
const constants_1 = require("../constants");
const user_1 = require("../user");
const message2call_1 = require("message2call");
let status = {
    status: false,
    message: '',
    address: [],
    // code: '',
    devices: [],
};
let host = 'http://localhost';
// const codeTools: {
//   timeout: NodeJS.Timer | null
//   start: () => void
//   stop: () => void
// } = {
//   timeout: null,
//   start() {
//     this.stop()
//     this.timeout = setInterval(() => {
//       void generateCode()
//     }, 60 * 3 * 1000)
//   },
//   stop() {
//     if (!this.timeout) return
//     clearInterval(this.timeout)
//     this.timeout = null
//   },
// }
const checkDuplicateClient = (newSocket) => {
    for (const client of [...wss.clients]) {
        if (client === newSocket || client.keyInfo.clientId != newSocket.keyInfo.clientId)
            continue;
        log4js_1.syncLog.info('duplicate client', client.userInfo.name, client.keyInfo.deviceName);
        client.isReady = false;
        for (const name of Object.keys(client.moduleReadys)) {
            client.moduleReadys[name] = false;
        }
        client.close(constants_1.SYNC_CLOSE_CODE.normal);
    }
};
const handleConnection = async (socket, request) => {
    const queryData = new URL(request.url, host).searchParams;
    const clientId = queryData.get('i');
    //   // if (typeof socket.handshake.query.i != 'string') return socket.disconnect(true)
    const userName = (0, user_1.getUserName)(clientId);
    if (!userName) {
        socket.close(constants_1.SYNC_CLOSE_CODE.failed);
        return;
    }
    const userSpace = (0, user_1.getUserSpace)(userName);
    const keyInfo = userSpace.dataManage.getClientKeyInfo(clientId);
    if (!keyInfo) {
        socket.close(constants_1.SYNC_CLOSE_CODE.failed);
        return;
    }
    const user = global.lx.config.users.find(u => u.name == userName);
    if (!user) {
        socket.close(constants_1.SYNC_CLOSE_CODE.failed);
        return;
    }
    keyInfo.lastConnectDate = Date.now();
    userSpace.dataManage.saveClientKeyInfo(keyInfo);
    //   // socket.lx_keyInfo = keyInfo
    socket.keyInfo = keyInfo;
    socket.userInfo = user;
    checkDuplicateClient(socket);
    try {
        await (0, sync_1.sync)(socket);
    }
    catch (err) {
        // console.log(err)
        log4js_1.syncLog.warn(err);
        socket.close(constants_1.SYNC_CLOSE_CODE.failed);
        return;
    }
    status.devices.push(keyInfo);
    // handleConnection(io, socket)
    (0, tools_1.sendStatus)(status);
    socket.onClose(() => {
        status.devices.splice(status.devices.findIndex(k => k.clientId == keyInfo.clientId), 1);
        (0, tools_1.sendStatus)(status);
    });
    // console.log('connection', keyInfo.deviceName)
    log4js_1.accessLog.info('connection', user.name, keyInfo.deviceName);
    // console.log(socket.handshake.query)
    socket.isReady = true;
};
const handleUnconnection = (userName) => {
    // console.log('unconnection')
    (0, user_1.releaseUserSpace)(userName);
};
const authConnection = (req, callback) => {
    // console.log(req.headers)
    // // console.log(req.auth)
    // console.log(req._query.authCode)
    (0, auth_1.authConnect)(req).then(() => {
        callback(null, true);
    }).catch(err => {
        callback(err, false);
    });
};
let wss;
function noop() { }
function onSocketError(err) {
    console.error(err);
}
const handleStartServer = async (port = 9527, ip = '127.0.0.1') => await new Promise((resolve, reject) => {
    const httpServer = node_http_1.default.createServer((req, res) => {
        // console.log(req.url)
        const endUrl = `/${req.url?.split('/').at(-1) ?? ''}`;
        let code;
        let msg;
        switch (endUrl) {
            case '/hello':
                code = 200;
                msg = constants_1.SYNC_CODE.helloMsg;
                break;
            case '/id':
                code = 200;
                msg = constants_1.SYNC_CODE.idPrefix + (0, user_1.getServerId)();
                break;
            case '/ah':
                void (0, auth_1.authCode)(req, res, lx.config.users);
                break;
            case '/export-list':
                void (0, auth_1.exportList)(req, res, lx.config.users);
                break;
            default:
                code = 401;
                msg = 'Forbidden';
                break;
        }
        if (!code)
            return;
        res.writeHead(code);
        res.end(msg);
    });
    wss = new ws_1.WebSocketServer({
        noServer: true,
    });
    wss.on('connection', function (socket, request) {
        socket.isReady = false;
        socket.moduleReadys = {
            list: false,
            dislike: false,
            statistics: false,
        };
        socket.feature = {
            list: false,
            dislike: false,
            statistics: false,
        };
        socket.on('pong', () => {
            socket.isAlive = true;
        });
        // const events = new Map<keyof ActionsType, Array<(err: Error | null, data: LX.Sync.ActionSyncType[keyof LX.Sync.ActionSyncType]) => void>>()
        // const events = new Map<keyof LX.Sync.ActionSyncType, Array<(err: Error | null, data: LX.Sync.ActionSyncType[keyof LX.Sync.ActionSyncType]) => void>>()
        // let events: Partial<{ [K in keyof LX.Sync.ActionSyncType]: Array<(data: LX.Sync.ActionSyncType[K]) => void> }> = {}
        let closeEvents = [];
        let disconnected = false;
        const msg2call = (0, message2call_1.createMsg2call)({
            funcsObj: sync_1.callObj,
            timeout: 120 * 1000,
            sendMessage(data) {
                if (disconnected)
                    throw new Error('disconnected');
                void (0, tools_1.encryptMsg)(socket.keyInfo, JSON.stringify(data)).then((data) => {
                    // console.log('sendData', eventName)
                    socket.send(data);
                }).catch(err => {
                    log4js_1.syncLog.error('encrypt message error:', err);
                    log4js_1.syncLog.error(err.message);
                    socket.close(constants_1.SYNC_CLOSE_CODE.failed);
                });
            },
            onCallBeforeParams(rawArgs) {
                return [socket, ...rawArgs];
            },
            onError(error, path, groupName) {
                const name = groupName ?? '';
                const userName = socket.userInfo?.name ?? '';
                const deviceName = socket.keyInfo?.deviceName ?? '';
                log4js_1.syncLog.error(`sync call ${userName} ${deviceName} ${name} ${path.join('.')} error:`, error);
                // if (groupName == null) return
                // // TODO
                // socket.close(SYNC_CLOSE_CODE.failed)
            },
        });
        socket.remote = msg2call.remote;
        socket.remoteQueueList = msg2call.createQueueRemote('list');
        socket.remoteQueueDislike = msg2call.createQueueRemote('dislike');
        socket.remoteQueueStatistics = msg2call.createQueueRemote('statistics');
        socket.addEventListener('message', ({ data }) => {
            if (typeof data != 'string')
                return;
            void (0, tools_1.decryptMsg)(socket.keyInfo, data).then((data) => {
                let syncData;
                try {
                    syncData = JSON.parse(data);
                }
                catch (err) {
                    log4js_1.syncLog.error('parse message error:', err);
                    socket.close(constants_1.SYNC_CLOSE_CODE.failed);
                    return;
                }
                msg2call.message(syncData);
            }).catch(err => {
                log4js_1.syncLog.error('decrypt message error:', err);
                log4js_1.syncLog.error(err.message);
                socket.close(constants_1.SYNC_CLOSE_CODE.failed);
            });
        });
        socket.addEventListener('close', () => {
            const err = new Error('closed');
            try {
                for (const handler of closeEvents)
                    void handler(err);
            }
            catch (err) {
                log4js_1.syncLog.error(err?.message);
            }
            closeEvents = [];
            disconnected = true;
            msg2call.destroy();
            if (socket.isReady) {
                log4js_1.accessLog.info('deconnection', socket.userInfo.name, socket.keyInfo.deviceName);
                // events = {}
                if (!status.devices.map(d => (0, user_1.getUserName)(d.clientId)).filter(n => n == socket.userInfo.name).length)
                    handleUnconnection(socket.userInfo.name);
            }
            else {
                const queryData = new URL(request.url, host).searchParams;
                log4js_1.accessLog.info('deconnection', queryData.get('i'));
            }
        });
        socket.onClose = function (handler) {
            closeEvents.push(handler);
            return () => {
                closeEvents.splice(closeEvents.indexOf(handler), 1);
            };
        };
        socket.broadcast = function (handler) {
            if (!wss)
                return;
            for (const client of wss.clients)
                handler(client);
        };
        void handleConnection(socket, request);
    });
    httpServer.on('upgrade', function upgrade(request, socket, head) {
        socket.addListener('error', onSocketError);
        // This function is not defined on purpose. Implement it with your own logic.
        authConnection(request, err => {
            if (err) {
                console.log(err);
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            }
            socket.removeListener('error', onSocketError);
            wss?.handleUpgrade(request, socket, head, function done(ws) {
                wss?.emit('connection', ws, request);
            });
        });
    });
    const interval = setInterval(() => {
        wss?.clients.forEach(socket => {
            if (socket.isAlive == false) {
                log4js_1.syncLog.info('alive check false:', socket.userInfo.name, socket.keyInfo.deviceName);
                socket.terminate();
                return;
            }
            socket.isAlive = false;
            socket.ping(noop);
            if (socket.keyInfo.isMobile)
                socket.send('ping', noop);
        });
    }, 30000);
    wss.on('close', function close() {
        clearInterval(interval);
    });
    httpServer.on('error', error => {
        console.log(error);
        reject(error);
    });
    httpServer.on('listening', () => {
        const addr = httpServer.address();
        // console.log(addr)
        if (!addr) {
            reject(new Error('address is null'));
            return;
        }
        const bind = typeof addr == 'string' ? `pipe ${addr}` : `port ${addr.port}`;
        log4js_1.startupLog.info(`Listening on ${ip} ${bind}`);
        resolve(null);
        void (0, sync_1.registerLocalSyncEvent)(wss);
    });
    host = `http://${ip.includes(':') ? `[${ip}]` : ip}:${port}`;
    httpServer.listen(port, ip);
});
// const handleStopServer = async() => new Promise<void>((resolve, reject) => {
//   if (!wss) return
//   for (const client of wss.clients) client.close(SYNC_CLOSE_CODE.normal)
//   unregisterLocalSyncEvent()
//   wss.close()
//   wss = null
//   httpServer.close((err) => {
//     if (err) {
//       reject(err)
//       return
//     }
//     resolve()
//   })
// })
// export const stopServer = async() => {
//   codeTools.stop()
//   if (!status.status) {
//     status.status = false
//     status.message = ''
//     status.address = []
//     status.code = ''
//     sendStatus(status)
//     return
//   }
//   console.log('stoping sync server...')
//   await handleStopServer().then(() => {
//     console.log('sync server stoped')
//     status.status = false
//     status.message = ''
//     status.address = []
//     status.code = ''
//   }).catch(err => {
//     console.log(err)
//     status.message = err.message
//   }).finally(() => {
//     sendStatus(status)
//   })
// }
const startServer = async (port, ip) => {
    // if (status.status) await handleStopServer()
    log4js_1.startupLog.info(`starting sync server in ${process.env.NODE_ENV == 'production' ? 'production' : 'development'}`);
    await handleStartServer(port, ip).then(() => {
        // console.log('sync server started')
        status.status = true;
        status.message = '';
        status.address = ip == '0.0.0.0' ? (0, tools_1.getAddress)() : [ip];
        // void generateCode()
        // codeTools.start()
    }).catch(err => {
        console.log(err);
        status.status = false;
        status.message = err.message;
        status.address = [];
        // status.code = ''
    });
    // .finally(() => {
    //   sendStatus(status)
    // })
};
exports.startServer = startServer;
const getStatus = () => status;
exports.getStatus = getStatus;
// export const generateCode = async() => {
//   status.code = handleGenerateCode()
//   sendStatus(status)
//   return status.code
// }
const getDevices = async (userName) => {
    const userSpace = (0, user_1.getUserSpace)(userName);
    return userSpace.getDecices();
};
exports.getDevices = getDevices;
const removeDevice = async (userName, clientId) => {
    if (wss) {
        for (const client of wss.clients) {
            if (client.userInfo?.name == userName && client.keyInfo?.clientId == clientId)
                client.close(constants_1.SYNC_CLOSE_CODE.normal);
        }
    }
    const userSpace = (0, user_1.getUserSpace)(userName);
    await userSpace.removeDevice(clientId);
};
exports.removeDevice = removeDevice;
