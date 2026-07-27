import { copyFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const serverDirectory = resolve('dist/server')

await mkdir(serverDirectory, { recursive: true })
await copyFile(resolve('worker/index.js'), resolve(serverDirectory, 'index.js'))
await copyFile(
  resolve('worker/reservationRules.js'),
  resolve(serverDirectory, 'reservationRules.js'),
)
