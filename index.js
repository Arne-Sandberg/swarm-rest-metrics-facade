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

const esClient = new elasticsearch.Client({
  host: esUrl,
  log: esLogLevel
})

async function teeForLogging (req, resp, cycle) {
  try {
    const body = resp.json
    const baseLogMsg = {
      resource: req.url.replace(/\?.*/, ''),
      url: req.url,
      remoteAddr: cycle.data('remoteAddress'),
      userAgent: cycle.data('userAgent')
    }
    if (resp.statusCode !== 200 || body.constructor !== Array) {
      console.log(`Ignoring non-200 or non-Array response: ${JSON.stringify(baseLogMsg)}`)
      return
    }
    const count = body.length
    const distinctSiteIds = body.reduce((accum, curr) => {
      const siteId = curr.site_location_name
      if (!siteId) {
        return accum
      }
      accum[siteId] = true
      return accum
    }, {})
    const siteCount = Object.keys(distinctSiteIds).length
    if (count < siteCount) {
      console.log(`[WARN] that doesn't look good. Record count=${count} is less than ` +
        `site count=${siteCount} for: ${JSON.stringify(baseLogMsg)}`)
    }
    await storeLog(Object.assign(baseLogMsg, {count, siteCount}))
  } catch (err) {
    console.error('Failed while logging a call')
  }
}

async function storeLog (values) {
  values.eventDate = new Date().toISOString()
  try {
    const response = await esClient.index({
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
