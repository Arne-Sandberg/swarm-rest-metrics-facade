## What is it?
A reverse proxy that does a (nice) man-in-the-middle attack for calls to a HTTP API and interrogates responses to count various things. The reponses pass through untouched, we just want to gather metrics. We count aspects about the responses as metrics about the API and store them in ElasticSearch so they can be visualised with Kibana.

## Run it directly

Run it with
```bash
export TARGET_URL=http://some.host:30001
export LISTEN_PORT=3000
export ES_URL=localhost:9200
export INDEX_NAME=swarm-metrics
node index.js
```

## Run it with docker-compose

Use it in a `docker-compose.yml` file like:
```yaml
version: '3'
services:
  server:
    image: postgrest/postgrest:v5.1.0
  statsFacade:
    image: tomsaleeba/swarm-facade
    ports:
      - "3000:3000"
    links:
      - server:server
      - elk:elk
    environment:
      TARGET_URL: http://server:3000
      LISTEN_PORT: 3000
      ES_URL: elk:9200
      INDEX_NAME: swarm-rest
    restart: unless-stopped
    depends_on:
      - server
      - elk
  elk:
    image: sebp/elk
    ports:
      - "5601:5601"
      - "9200:9200"
    restart: unless-stopped
```

## Improvement ideas

  1. log the plot IDs from the response to ElasticSearch so we can see which ones are most popular
  1. users calling the API directly can filter columns so the plot ID won't always be there. We need to support this gracefully.

