import axios from 'axios'
import { compile } from 'json-schema-to-typescript'
import { mkdirSync, writeFileSync } from 'fs'
import { serializeError } from 'serialize-error'
import { Octokit } from '@octokit/rest'

const tag = 'v1.26'
const repo = { owner: 'factisresearch', repo: 'envoy-config-schema' }

const octokit = new Octokit()
mkdirSync('json')
mkdirSync('ts')

await octokit.rest.repos.getReleaseByTag({ ...repo, tag }).then((response) =>
    response.data.assets.filter((asset) => asset.content_type === 'application/json').map(asset => {
        const name = asset.name.slice(0, -5)
        axios.get(asset.browser_download_url).then((response) => {
            writeFileSync(`json/${name}.json`, JSON.stringify(response.data, null, 4))
            // https://github.com/bcherny/json-schema-to-typescript/issues/132#issuecomment-1243972195
            const ref = response.data['$ref']
            delete response.data['$ref']
            response.data['allOf'] = [{ '$ref': ref }]
            compile(response.data, name).then((result: string) => writeFileSync(`ts/${name}.ts`, result))
        })
        return name
    })
).then((names) =>
    writeFileSync('index.ts', names.map((name) => `export * as ${name} from './ts/${name}.js'`).join('\n').concat('\n'))
).catch((err) => {
    console.error(serializeError(err))
    process.exit(-1)
})
