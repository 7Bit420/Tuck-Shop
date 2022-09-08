import { serverConfig } from './startup'
import * as os from 'os'
import * as fs from 'fs'

const PWD: string = process.env.PWD
var log = [
    "Lorem ipsum dolor sit amet,",
    "consectetur adipiscing elit. ",
    "Proin odio est, dignissim consectetur ",
    "faucibus in, pretium at leo. Curabitur ",
    "malesuada aliquet erat, in ",
    "egestas urna gravida nec. ",
    "Aliquam erat volutpat. ",
    "Curabitur a congue mauris. ",
    "Sed quis tortor et nulla a",
    "uctor scelerisque et ut lorem. ",
    "Integer mollis placerat nulla non ",
    "faucibus. Pellentesque p",
    "ellentesque bibendum neque ",
    "in aliquet. Sed imperdiet ",
    "faucibus elit ut semper. ",
    "Nulla odio sem, hendrerit in ",
    "varius nec, varius ut lacus.",
]
var termLog: string[] = ['s', '1']
var crntcmd = ''

function minmax(min: number, max: number, x: number) {
    return Math.min(Math.max(min, x), max)
}

function renderServerStatus(width: number, height: number, scroll: number = 0) {
    var renderServers = serverConfig.servers.slice(scroll, height + scroll)

    return renderServers.map(server => {
        var nameWidth = minmax(5, 10, width)
        var str = `[${server.name.slice(0, nameWidth).padEnd(nameWidth, ' ')}]`
        str += `[${/*server?.active*/ true ? ' ACTIVE ' : 'UNACITVE'}] `
        str += 'Some Other Infomation'.slice(0, nameWidth - 13)
        return str.padEnd(width, ' ')
    })
}

function renderTerminal(width: number, height: number) {
    var out: string[] = new Array(height)
    for (let i = 1; i < height; i++) {
        fs.appendFileSync(PWD + '/test.txt', (termLog[i] ?? '').slice(0, width).padEnd(width, ' ') + '\n')
        out[i] = (termLog[i] ?? '').slice(0, width).padEnd(width, ' ')
    }
    out[0] = '> ' + crntcmd
    out.reverse()
    return out
}

function renderConsoleGui() {
    console.clear()
    var { 0: x, 1: y } = process.stdout.getWindowSize()
    var termHight = 4
    var premWidth = minmax(10, 60, x * 0.7)
    var logWith = x - 1 - premWidth
    var serverStatus = renderServerStatus(premWidth, y - termHight - 1)

    for (let i = 0; i < y - termHight - 1; i++) {
        process.stdout.write((serverStatus[i] ?? '').padEnd(premWidth, ' ') + '|' + log[i].slice(0, logWith).padEnd(logWith, ' '))
    }
    var divStr = ''.padEnd(premWidth, '-')
    divStr += '┴'
    divStr += ''.padEnd(logWith, '-')
    process.stdout.write(divStr)
    process.stdout.write(renderTerminal(x, termHight).join(''))
}
function init() {
    process.stdin.setRawMode(true)
    process.stdin.setNoDelay(true)
    process.stdin.setEncoding('ascii')
    process.stdin.on('data', async (data: string) => {
        switch (data) {
            case '':
                process.exit()
            case '\n\r':
            case '\r\n':
            case os.EOL:
            case 'd':
                termLog.unshift(crntcmd)
                crntcmd = ''
                break;
            case '\u0127':
                crntcmd = crntcmd.slice(0, crntcmd.length - 1)
                break;
            default:
                crntcmd += data
                break;
        }
        await new Promise(res => process.stdout.clearLine(0, () => res(void (0))))
        process.stdout.write('> ' + crntcmd)
    })
}

export { renderConsoleGui as renderConsole, init }