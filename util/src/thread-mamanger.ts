import EventEmitter = require('events')
import * as stream from 'stream'
import * as http from 'http'
import * as uuid from 'uuid'
import * as ws from 'ws'

type msg = {
    id: string
    target: string
    head: msgHead
    body: any
    sender?: string
}

type msgHead = NodeJS.Dict<string | number | boolean>
type msgBody = any

class threadManager extends EventEmitter {

    #httpServer: http.Server
    #websocket: ws.Server

    #boundMethods: NodeJS.Dict<Function> = {}
    #globalData: NodeJS.Dict<any> = {}
    #smartObjects: NodeJS.Dict<string> = {}
    #clients: Map<string, ws.WebSocket>
    #clientData: Map<string, NodeJS.Dict<any>>
    #eventGroups: Map<string, string[]>
    #id = 'root'
    get id() { return this.#id }
    get globalData() { return this.#globalData }
    openInfo: any

    constructor(port: number, id: string = 'root', openInfo?: any) {
        super()
        this.#eventGroups = new Map()
        this.#clientData = new Map()
        this.#clients = new Map()
        this.openInfo = openInfo
        this.#id = id
        this.#globalData = {}
        this.#smartObjects = {}

        this.#boundMethods = {}
        for (var method in threadManager.#methods) {
            this.#boundMethods[method] = threadManager.#methods[method].bind(this)
        }

        this.#httpServer = http.createServer()
        this.#websocket = new ws.Server({ server: this.#httpServer })

        this.#httpServer.listen(port, 'localhost')

        this.#httpListner = this.#httpListner.bind(this)
        this.#httpServer.on('request', this.#httpListner)

        this.#wsListner = this.#wsListner.bind(this)
        this.#websocket.on('connection', (...args) => this.#wsListner(...args))

    }

    #httpListner = function (
        this: threadManager,
        req: http.IncomingMessage,
        res: http.ServerResponse
    ) {

    }

    #wsListner = function (
        this: threadManager,
        client: ws.WebSocket,
        req: http.IncomingMessage
    ) {
        var reqUrl = new URL(req.url, `http://${req.headers.host}/`);

        switch (reqUrl.pathname) {
            case '/connect':
                if (!reqUrl.searchParams.has('id')) {
                    client.terminate()
                    return
                }
                if (this.#clients.has(reqUrl.searchParams.get('id'))) {
                    client.terminate()
                    return
                }
                this.#addClient(client, reqUrl.searchParams.get('id'))
                break;
            default:
                client.terminate()
                break;
        }
    }

    #formMessage = function (
        id: string,
        target: string,
        head: msgHead,
        body: any,
        sender: string = this.#id
    ): string {
        return JSON.stringify({
            id: id,
            target: target,
            sender: sender,
            head: head,
            body: body
        })
    }

    #addClient = function (
        this: threadManager,
        client: ws.WebSocket,
        clid: string
    ) {
        this.#clients.set(clid, client)
        this.#clientData.set(clid, {
            eventGroups: []
        })

        client.on('message', (data, binary) => {
            var msg: msg = JSON.parse(data.toString('ascii'))

            if (this.#clients.has(msg.target)) {
                var target = this.#clients.get(msg.target)
                msg.sender = clid
                target.send(JSON.stringify(msg))
            } else if (msg.target == this.#id) {
                const respond = (
                    head: msgHead,
                    body: msgBody
                ) => {
                    client.send(this.#formMessage(msg.id, clid, head, body))
                }
                if (this.#boundMethods[String(msg.head?.type)]) {
                    this.#boundMethods[String(msg.head?.type)](client, msg, clid, respond)
                } else {
                    this.#boundMethods.message(msg, client, clid, respond)
                }
            } else {
                this.#formMessage(
                    msg.id,
                    clid,
                    { success: false },
                    {
                        responseCode: 404,
                        message: `Could Not Find Client With Id ${msg.target}`
                    }
                )
            }

        })

        client.on('close', (code) => {
            this.#clients.delete(clid)
            var cldata = this.#clientData.get(clid)
            cldata.eventGroups.forEach(grid => {
                var clidi = 0;
                if ((clidi = this.#eventGroups.get(grid).findIndex(t => t == clid)) < 0) {
                    return
                }
                this.#eventGroups.get(grid).splice(clidi, 1)
            });
        })

        const openListner = () => {
            client.send(this.openInfo)
        }
        client.on('open', openListner)
    }

    static #methods: NodeJS.Dict<Function> = {
        addClientToEventGroup(
            this: threadManager,
            client: ws.WebSocket,
            msg: msg,
            clid: string,
            respond: (head: msgHead, body: msgBody) => any
        ) {
            var grid = msg.body.grid
            if (this.#eventGroups.has(grid) && grid) {
                this.#clientData.get(clid).eventGroups.push(grid)
                this.#eventGroups.get(grid).push(clid)
                respond({}, true)
            } else {
                respond({}, false)
            }
        },
        removeClientFromEventGroup(
            this: threadManager,
            client: ws.WebSocket,
            msg: msg,
            clid: string,
            respond: (head: msgHead, body: msgBody) => any
        ) {
            var grid = msg.body?.grid
            if (this.#eventGroups.has(grid) && grid) {
                var clidi = 0;
                if ((clidi = this.#eventGroups.get(grid).findIndex(t => t == clid)) < 0) {
                    return respond({}, false)
                }
                this.#eventGroups.get(grid).splice(clidi, 1)
                respond({}, true)
            } else {
                respond({}, false)
            }
        },
        createEventGroup(
            this: threadManager,
            client: ws.WebSocket,
            msg: msg,
            clid: string,
            respond: (head: msgHead, body: msgBody) => any
        ) {
            var grid = msg.body.grid
            if (!this.#eventGroups.has(grid) && grid) {
                this.#eventGroups.set(grid, [])
                respond({}, true)
            } else {
                respond({}, false)
            }
        },
        emitEvent(
            this: threadManager,
            client: ws.WebSocket,
            msg: msg,
            clid: string,
            respond: (head: msgHead, body: msgBody) => any
        ) {
            var grid = msg.head.grid.toString()
            if (this.#eventGroups.has(grid) && grid) {
                this.#eventGroups.get(grid).forEach(trgtid => {
                    this.#clients.get(trgtid).send(this.#formMessage(msg.id, trgtid, {
                        type: 'event',
                    }, {
                        data: msg.body,
                        event: msg.head.grid,
                        src: clid
                    }))
                })
                respond({}, true)
            } else {
                respond({}, false)
            }
        },
        setGlobalData(
            this: threadManager,
            client: ws.WebSocket,
            msg: msg,
            clid: string,
            respond: (head: msgHead, body: msgBody) => any
        ) {
            this.globalData[msg.body.key] = msg.body.value
        },
        getGlobalData(
            this: threadManager,
            client: ws.WebSocket,
            msg: msg,
            clid: string,
            respond: (head: msgHead, body: msgBody) => any
        ) {
            return this.globalData[msg.body.key]
        },
        setSmartObjectOwner(
            this: threadManager,
            client: ws.WebSocket,
            msg: msg,
            clid: string,
            respond: (head: msgHead, body: msgBody) => any
        ) {
            this.#smartObjects[msg.body.id] = clid
        },
        getSmartObjectOwner(
            this: threadManager,
            client: ws.WebSocket,
            msg: msg,
            clid: string,
            respond: (head: msgHead, body: msgBody) => any
        ) {
            respond({}, this.#smartObjects[msg.body.id])
        },
        message(
            this: threadManager,
            msg: msg,
            client: ws.WebSocket,
            clid: string,
            respond: (head: msgHead, body: msgBody) => any
        ) {
            this.emit('message', msg.head, msg.body, respond)
        }
    }
}

class client extends EventEmitter {

    #websocket: ws.WebSocket
    #id: string
    #tagedRequests: Map<string, Function>

    get id() { return this.#id }

    constructor(
        id: string,
        port: number,
        address: string = 'localhost'
    ) {
        super()
        this.#id = id
        this.#websocket = new ws.WebSocket(`ws://${address}:${port}/connect?id=${id}`)
        this.#tagedRequests = new Map()

        this.#websocket.on('open', () => this.emit('ready'))

        this.#websocket.on('message', (data, binary) => {
            var msg: msg = JSON.parse(data.toString('ascii'))

            if (this.#tagedRequests.has(msg.id)) {
                this.#tagedRequests.get(msg.id)({ head: msg.head, body: msg.body })
                this.#tagedRequests.delete(msg.id)
            }
            this.emit('message', msg.head, msg.body, (
                head: msgHead,
                body: msgBody
            ) => {
                this.#websocket.send(this.#formMessage(msg.id, msg.sender, head, body, this.#id))
            })
        })
    }

    async send(
        head: msgHead,
        body: msgBody,
        target: string,
        expectsResponse: boolean = false
    ): Promise<undefined | { head: msgHead, body: msgBody }> {
        var id = uuid.v4()

        this.#websocket.send(this.#formMessage(id, target, head, body, this.#id))

        if (expectsResponse) {
            return new Promise(res => this.#tagedRequests.set(id, res))
        } else {
            return undefined
        }
    }

    #formMessage = function (
        id: string,
        target: string,
        head: msgHead,
        body: any,
        sender: string = this.#id
    ): string {
        return JSON.stringify({
            id: id,
            target: target,
            sender: sender,
            head: head,
            body: body
        })
    }
}

class smartObject {

    client: client
    id: string

    #owner
    #obj

    #set(propname, v) {
        this.#obj[propname] = v
        this.client.send({
            type: 'emitEvent',
            grid: `smart-objects:${this.id}:change`
        }, {
            key: propname,
            value: v
        }, 'root', true)
    }
    #get(propname) {
        return this.#obj[propname]
    }

    constructor(client: client, propities: Array<string> | string) {
        this.#obj = {}
        this.client = client;

        this.#initProps(propities)
    }

    async #initProps(propities: Array<string> | string) {

        if (typeof propities == 'string') {
            this.id = propities
            this.#owner = (await this.client.send({
                type: 'getSmartObjectOwner'
            }, {
                id: this.id
            }, 'root', true)).body
            var res = (await this.client.send({
                type: `getObject:${this.id}`
            }, {}, this.#owner, true))
            this.#obj = res.body.obj

            res.body.props?.forEach(t => {
                Object.defineProperty(this, t, {
                    get: this.#get.bind(this, t),
                    set: this.#set.bind(this, t),
                });
            })
            Object.seal(this)
        } else {
            this.id = uuid.v4()
            this.client.send({
                type: 'createEventGroup'
            }, {
                grid: `smart-objects:${this.id}:change`
            }, 'root')
            this.#owner = this.client.id
            this.client.send({
                type: 'setSmartObjectOwner'
            }, {
                id: this.id
            }, 'root')
        }

        this.client.send({
            type: 'addClientToEventGroup'
        }, {
            grid: `smart-objects:${this.id}:change`
        }, 'root')

        this.client.on(`message`, ((head, body, respond) => {
            switch (head.type) {
                case 'event':
                    if (body.src == this.client.id) return;
                    switch (body.event) {
                        case `smart-objects:${this.id}:change`:
                            this.#obj[body.data.key] = body.data.value
                            break;
                    }
                    break;
                case `getObject:${this.id}`:
                    respond({
                        type: 'response'
                    }, {
                        obj: this.#obj,
                        props: propities
                    })
                    break;
            }
        }).bind(this))

        if (typeof propities == 'string') return

        if (Object.keys(smartObject.prototype).some(t => propities.includes(t))) throw new TypeError("Propity Allready Used");
        if (propities.some(t => t.startsWith('#'))) throw new TypeError("Propity Cannot Be Private");


        propities.forEach(t => {
            Object.defineProperty(this, t, {
                get: this.#get.bind(this, t),
                set: this.#set.bind(this, t),
            })
        })

        Object.seal(this)
    }
}

export { threadManager, client, smartObject }

