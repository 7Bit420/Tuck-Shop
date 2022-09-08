import * as fs from 'fs'

function readdirRecersive(
    path: string,
    options: { 
        dirent?: true,
        includedirs?: boolean
    }
): fs.Dirent[];
function readdirRecersive(
    path: string,
    options: { 
        dirent?: false,
        includedirs?: boolean
    }
): string[];
function readdirRecersive(
    path: string
): string[];
function readdirRecersive(
    path: string,
    options?: { 
        dirent?: undefined,
        includedirs?: boolean
    }
): string[] | fs.Dirent[] {

    var files = fs.readdirSync(path, { withFileTypes: options?.dirent ? true : undefined })
    var v = []

    files.forEach(t=>{
        if (options?.dirent ? t.isDirectory() : fs.lstatSync(`${path}/${t}`).isDirectory()) {
            v.push(...readdirRecersive(`${path}/${t}`, options))
            if (options?.includedirs) { v.push(t) }
        } else if (options?.dirent ? true : fs.lstatSync(`${path}/${t}`).isFile()) {
            v.push(t)
        }
    })

    return v
}

export { readdirRecersive }