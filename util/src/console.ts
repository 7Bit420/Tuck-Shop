import { threadManager, serverConfig, servers } from './startup'
import { client } from './thread-mamanger'

function initConsole() {
    const wsClient = new client('root-int', 5000)

    process.stdin.on('data', (d) => {
        const args = d.toString('ascii').trim().split(' ')

        switch (args[0]) {
            case 'log':
                wsClient.send({
                    db: 'logs',
                    method: 'makeEntry'
                }, [
                    { time: Date.now() }
                ], 'database', true)//.then((data) => console.log(data.body))
                break;
            case 'push':
                wsClient.send({
                    db: 'queue',
                    method: 'addItem'
                }, [
                    { time: Date.now() }
                ], 'database', true)//.then((data) => console.log(data.body))
                break;
            case 'shift':
                wsClient.send({
                    db: 'queue',
                    method: 'removeItem'
                }, [
                    args[1]
                ], 'database', true)//.then((data) => console.log(data.body))
                break;
        }
    })

    console.log('Init')
}

function exit() {
    servers.forEach(t => t)
}

export { initConsole }