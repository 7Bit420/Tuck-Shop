import { config as CONFIG } from '../index'
import * as http from 'http'
import * as fs from 'fs'

const mmie = JSON.parse(fs.readFileSync(CONFIG['content-type-file']).toString())

const path = '/'
const type = 'special'
const config = {
    type: 'rootHttp'
}

function handler(
    req: http.IncomingMessage,
    res: http.ServerResponse
) {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (
        fs.existsSync(`${CONFIG['page-dir']}/${url.pathname}`) &&
        fs.lstatSync(`${CONFIG['page-dir']}/${url.pathname}`).isFile()
    ) {
        res.writeHead(200, {
            'Content-Type': mmie.find(t => url.pathname.endsWith(t.ext)) ?? 'text/plain'
        })
        res.write(fs.readFileSync(`${CONFIG['page-dir']}/${url.pathname}`))
    } else if (
        fs.existsSync(`${CONFIG['page-dir']}/${url.pathname}.html`) &&
        fs.lstatSync(`${CONFIG['page-dir']}/${url.pathname}.html`).isFile()
    ) {
        res.writeHead(200, {
            'Content-Type': 'text/html'
        })
        res.write(fs.readFileSync(`${CONFIG['page-dir']}/${url.pathname}.html`))
    } else if (
        fs.existsSync(`${CONFIG['page-dir']}/${url.pathname}/.html`) &&
        fs.lstatSync(`${CONFIG['page-dir']}/${url.pathname}/.html`).isFile()
    ) {
        res.writeHead(200, {
            'Content-Type': 'text/html'
        })
        res.write(fs.readFileSync(`${CONFIG['page-dir']}/${url.pathname}/.html`))
    } else if (
        fs.existsSync(`${CONFIG['page-dir']}/${url.pathname}`) &&
        fs.lstatSync(`${CONFIG['page-dir']}/${url.pathname}`).isSymbolicLink()
    ) {
        res.writeHead(302, {
            'Location': '/' + fs.readlinkSync(`${CONFIG['page-dir']}/${url.pathname}`)
        })
    } else {
        res.writeHead(404)
        res.write('File Not Found')
    }

    res.end()
}

export { path, type, config, handler }