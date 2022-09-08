import EventEmitter = require('events')
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

export { client, smartObject }