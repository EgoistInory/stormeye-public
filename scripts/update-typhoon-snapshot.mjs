import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const base = 'https://typhoon.nmc.cn/weatherservice/typhoon/jsons'
const output = resolve('public/data/nmc-latest.json')

function parseJsonp(source) {
  const start = source.indexOf('{')
  const end = source.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('NMC returned invalid JSONP')
  return JSON.parse(source.slice(start, end + 1))
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      accept: 'application/javascript,text/plain,*/*',
      referer: 'https://typhoon.nmc.cn/publish/typhoon/warning.html',
      'user-agent': 'StormEye-China-Snapshot/1.0',
    },
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) throw new Error(`NMC returned ${response.status}`)
  return response.text()
}

const listPayload = parseJsonp(await fetchText(`${base}/list_default?callback=typhoon_jsons_list_default`))
const active = Array.isArray(listPayload.typhoonList)
  ? listPayload.typhoonList.filter((item) => Array.isArray(item) && item[7] === 'start')
  : []

const coastalCities = [
  [121.47, 31.23], [121.55, 29.87], [120.7, 28], [119.3, 26.08],
  [118.09, 24.48], [116.68, 23.35], [114.06, 22.55],
]

function distanceScore(detail) {
  const observed = Array.isArray(detail.typhoon?.[8]) ? detail.typhoon[8] : []
  const latest = observed.at(-1)
  const longitude = Number(latest?.[4])
  const latitude = Number(latest?.[5])
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return Number.POSITIVE_INFINITY
  return Math.min(...coastalCities.map(([cityLongitude, cityLatitude]) => (
    Math.hypot((longitude - cityLongitude) * Math.cos(latitude * Math.PI / 180), latitude - cityLatitude)
  )))
}

let next
if (active.length) {
  const candidates = await Promise.all(active.map(async (item) => {
    const id = String(item[0])
    if (!/^\d+$/.test(id)) throw new Error('NMC returned an invalid active storm id')
    const detail = parseJsonp(await fetchText(`${base}/view_${id}?callback=typhoon_jsons_view_${id}`))
    return { item, detail }
  }))
  candidates.sort((a, b) => distanceScore(a.detail) - distanceScore(b.detail))
  const { item: selected, detail } = candidates[0]
  const id = String(selected[0])
  const observed = Array.isArray(detail.typhoon?.[8]) ? detail.typhoon[8] : []
  const latest = observed.at(-1)
  const signature = JSON.stringify([id, latest?.[1], latest?.[4], latest?.[5], latest?.[7], latest?.[11]])
  next = { active: true, fetchedAt: new Date().toISOString(), signature, listItem: selected, detail }
} else {
  next = { active: false, fetchedAt: new Date().toISOString(), signature: 'no-active-storm' }
}

let previous
try {
  previous = JSON.parse(await readFile(output, 'utf8'))
} catch {
  previous = null
}

if (previous?.signature === next.signature) {
  console.log(`NMC snapshot unchanged: ${next.signature}`)
} else {
  await mkdir(dirname(output), { recursive: true })
  await writeFile(output, `${JSON.stringify(next)}\n`, 'utf8')
  console.log(`NMC snapshot updated: ${next.signature}`)
}
