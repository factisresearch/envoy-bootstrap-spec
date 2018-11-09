import axios, { AxiosResponse } from 'axios'
import { compile } from 'json-schema-to-typescript'
import { writeFileSync } from 'fs'
import { serializeError } from 'serialize-error'

const url: string = 'https://github.com/factisresearch/envoy-config-schema/releases/download/v1.26.1/v3_Bootstrap.json'
const out: string = 'index.ts'

await axios.get(url).then((response: AxiosResponse) => {
    // https://github.com/bcherny/json-schema-to-typescript/issues/132#issuecomment-1243972195
    const ref = response.data['$ref']
    delete response.data['$ref']
    response.data['allOf'] = [{ '$ref': ref }]
    compile(response.data, 'envoy-bootstrap-spec').then(
        (compile: string) =>
            writeFileSync(out, compile)
    )
}

).catch((err) => {
    console.error(serializeError(err))
    process.exit(-1)
})
