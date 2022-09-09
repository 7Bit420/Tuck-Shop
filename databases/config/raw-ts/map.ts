class jsonQueue extends Map{

    constructor(path: string) {
        super()
    }

    getSize() { return this.size }
}

export { jsonQueue as handler }
