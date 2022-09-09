import * as tm from './thread-mamanger'
import * as consoleV2 from './console'
import * as cp from 'child_process'
import * as cluster from 'cluster'
import * as yaml from 'yaml'
import * as fs from 'fs'

type server = {
    name: string
    dirname: string
    type: 'node' | 'executable'
    runfile: string
    args?: string[]
    env?: NodeJS.ProcessEnv
    flags?: string[]
    detached?: boolean,
    capabilities?: NodeJS.Dict<boolean>
}

const PWD: string = process.env.PWD
const threadManager = new tm.threadManager(5000)

threadManager.on('message', (head, body, respond) => {
    console.log(body)
    respond({}, { msg: 'world' })
})

const serverConfig: {
    servers: server[]
} = yaml.parse(fs.readFileSync(process.env.PWD + '/servers/config.yml').toString('ascii'));
const servers = []

serverConfig.servers.forEach(server => {

    switch (server.type) {
        case 'node':
            var args = server.flags?.map(t => '--' + t) ?? []
            args.push(...(server?.args ?? []))
            servers.push(cp.fork(`${PWD}/servers/${server.dirname}/${server.runfile}`, {
                env: server.env,
                execArgv: args,
                detached: server.detached,
                
            }))
            break;
        default:
            break;
    }
})

consoleV2.initConsole()

export { serverConfig, threadManager, servers }