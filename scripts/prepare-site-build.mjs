import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const serverDirectory = resolve('dist/server')
const workerEntry = `export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request)

    if (response.status !== 404) {
      return response
    }

    const url = new URL(request.url)
    url.pathname = '/'
    return env.ASSETS.fetch(new Request(url, request))
  },
}
`

await mkdir(serverDirectory, { recursive: true })
await writeFile(resolve(serverDirectory, 'index.js'), workerEntry, 'utf8')
