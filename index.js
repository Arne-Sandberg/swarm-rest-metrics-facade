const hoxy = require('hoxy')
const elasticsearch = require('elasticsearch')

const port = process.env.LISTEN_PORT || 3000
const targetUrl = process.env.TARGET_URL || 'http://localhost:3000'
const esUrl = process.env.ES_URL || 'localhost:9200'
const esLogLevel = process.env.ES_LOG_LEVEL || 'error'
const indexName = process.env.INDEX_NAME || 'ausplots_r'

process.on('SIGINT', function () {
  process.exit() // https://github.com/nodejs/node/issues/4182#issuecomment-163425328
})

const proxy = hoxy.createServer({
  reverse: targetUrl
}).listen(port, function () {
  console.error(getConfigMsg())
  console.error('Startup successful')
})
proxy.intercept('request', (req, resp, cycle) => {
  cycle.data('remoteAddress', req._source.connection.remoteAddress)
  cycle.data('userAgent', req._source.headers['user-agent'])
})
proxy.intercept({
  phase: 'response',
  method: 'GET',
  mimeType: 'application/json',
  as: 'json'
}, function (req, resp, cycle) {
  teeForLogging(req, resp, cycle) // we're not waiting for logging, that happens in the background
})

async function teeForLogging (req, resp, cycle) {
  const body = resp.json
  const baseLogMsg = {
    resource: req.url.replace(/\?.*/, ''),
    url: req.url,
    remoteAddr: cycle.data('remoteAddress'),
    userAgent: cycle.data('userAgent')
  }
  if (body.constructor !== Array) {
    const notAnArrayLogMsg = Object.assign(baseLogMsg, {count: -1, siteCount: -1})
    storeLog(notAnArrayLogMsg)
    return
  }
  const count = body.length
  const distinctSiteIds = body.reduce((accum, curr) => {
    accum[curr.site_location_name] = true // assumption is all responses will always have this field
    return accum
  }, {})
  const siteCount = Object.keys(distinctSiteIds).length
  await storeLog(Object.assign(baseLogMsg, {count, siteCount}))
}

async function storeLog (values) {
  const client = new elasticsearch.Client({ // TODO should we only create the client once?
    host: esUrl,
    log: esLogLevel
  })
  values.eventDate = new Date().toISOString()
  try {
    const response = await client.index({
      index: indexName,
      type: 'apicall',
      body: values,
    })
    // console.log(response)
  } catch (err) {
    console.error('Failed to send message to ElasticSearch', err)
  }
}

function getConfigMsg () {
  return `Runtime config:
    listen port:       ${port}
    target URL:        ${targetUrl}
    ElasticSearch URL: ${esUrl}
    ElasticSearch log: ${esLogLevel}`
}
