import * as uuid from 'uuid'
import * as fs from 'fs'

class jsonQueue {

    #path: string = ''
    #queue: string[]
    constructor(path: string) {
        this.#path = path
        this.#queue = []
        if (!fs.existsSync(path)) fs.mkdirSync(path);
    }

    addItem(data: any) {
        var id = uuid.v4()
        while (fs.existsSync(`${this.#path}/${id}.json`)) { id = uuid.v4() }

        fs.writeFileSync(`${this.#path}/${id}.json`, JSON.stringify(data))

        this.#queue.push(id)
        return id
    }
    removeItem(id: string) {
        this.#queue.slice(this.#queue.findIndex(t => t == id), 1)
        var data = JSON.parse(fs.readFileSync(`${this.#path}/${id}.json`).toString('ascii'))
        fs.unlinkSync(`${this.#path}/${id}.json`)
        return data
    }
    getItem(at: number) {
        return this.#queue[at] ?? (() => { throw new Error('Out of bounds') })()
    }
    getSize() {
        return this.#queue.length
    }
}

export { jsonQueue as handler }
