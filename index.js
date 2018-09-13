const hoxy = require('hoxy')
var port = 8888
var proxy = hoxy.createServer({
  reverse: 'http://swarmapi.ausplots.aekos.org.au:3000'
}).listen(port, function() {
  console.error('The proxy is listening on port ' + port + '.')
  console.log('remoteAddress,endpoint,resource,rows,plots')
})
proxy.intercept('request', (req, resp, cycle) => {
  cycle.data('remoteAddress', req._source.connection.remoteAddress)
})
proxy.intercept({
  phase: 'response',
  method: 'GET',
  mimeType: 'application/json',
  //fullUrl: 'http://example.com/users/123',
  as: 'json'
}, function(req, resp, cycle) {
  teeForLogging(req, resp, cycle)
})

async function teeForLogging (req, resp, cycle) {
  const body = resp.json
  if (body.constructor !== Array) {
    console.log('response is NOT an array')
    return
  }
  const count = body.length
  const distinctPlotIds = body.reduce((accum, curr) => {
    accum[curr.site_location_name] = true
    return accum
  }, {})
  const plotCount = Object.keys(distinctPlotIds).length
  const resource = req.url.replace(/\?.*/, '')
  console.log(`${cycle.data('remoteAddress')},${req.url},${resource},${count},${plotCount}`)
}

