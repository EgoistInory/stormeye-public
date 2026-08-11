import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const endpoint = 'https://www.nmc.cn/rest/findAlarm?pageNo=1&pageSize=100'
const output = resolve('public/data/nmc-warnings-latest.json')

const response = await fetch(endpoint, {
  headers: {
    accept: 'application/json',
    referer: 'https://www.nmc.cn/f/alarm.html',
    'user-agent': 'StormEye-China-Snapshot/1.0',
  },
  signal: AbortSignal.timeout(20_000),
})
if (!response.ok) throw new Error(`NMC warning feed returned ${response.status}`)
const payload = await response.json()
const pageItems = payload?.data?.page?.list
const provinceItems = payload?.data?.provinceAlarms
if (!Array.isArray(pageItems) || !Array.isArray(provinceItems)) {
  throw new Error('NMC warning feed returned invalid data')
}
const ids = [...provinceItems, ...pageItems].map((item) => String(item?.alertid ?? '')).filter(Boolean)
if (!ids.length) throw new Error('NMC warning feed returned no warnings')
const signature = JSON.stringify(ids)
const next = { fetchedAt: new Date().toISOString(), signature, payload }

let previous
try {
  previous = JSON.parse(await readFile(output, 'utf8'))
} catch {
  previous = null
}

if (previous?.signature === signature) {
  console.log(`NMC warning snapshot unchanged: ${ids.length} records`)
} else {
  await mkdir(dirname(output), { recursive: true })
  await writeFile(output, `${JSON.stringify(next)}\n`, 'utf8')
  console.log(`NMC warning snapshot updated: ${ids.length} records`)
}
