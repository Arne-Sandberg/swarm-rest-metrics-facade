## What is it?
A reverse proxy that does a (nice) man-in-the-middle attack for calls to a HTTP API and interrogates responses to count various things. The reponses pass through untouched, we just want to gather metrics. We count aspects about the responses as metrics about the API and store them in ElasticSearch so they can be visualised with Kibana.

## Run it directly

```bash
TARGET_URL=http://some.host:30001
LISTEN_PORT=8080
export ES_URL=localhost:9200
export INDEX_NAME=swarm-metrics
# optionally create and activate a virtualenv
pip install -r requirements.txt
mitmdump \
  -p $LISTEN_PORT \
  --mode reverse:$TARGET_URL \
  -s ./log-metrics.py
```

## Run the docker container directly
```bash
IMAGE_NAME='tomsaleeba/swarm-rest-metrics-facade:test'
docker build -t $IMAGE_NAME .
# FIXME need instructions on how to deploy this to the same network as an ES instance, then use ES_URL env var
docker run \
  --rm \
  -it \
  -e TARGET_URL=http://swarmapi.ausplots.aekos.org.au \
  -p 30000:80 \
  $IMAGE_NAME
# in another terminal
curl 'http://localhost:30000/site?limit=1'
```

## Run it with docker-compose

An example is defined in `example/docker-compose.yml`, run it with:
```bash
cd example/
docker-compose up
# wait for a few seconds for ES to be ready
# in another terminal
curl 'localhost:30000/site?limit=1'
curl 'localhost:9200/swarm-rest/_search' # check metric was added to ES
# back to original terminal
# <C-c> to kill
docker-compose down
```

## Improvement ideas

  1. log the plot IDs from the response to ElasticSearch so we can see which ones are most popular

