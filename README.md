# Docker Monitoring

## Service to capture when docker container dies and send to slack

## How to run
#### On swarm mode

```
docker service create \
    --mode global \
    --restart-condition any \
    --mount type=bind,src=/var/run/docker.sock,dst=/var/run/docker.sock \
    -e SLACK_URL="https://hooks.slack.com/services/YOUR_TOKEN_HERE" \
    --name docker-monitoring \
    renatomachado/docker-monitoring:${VERSION}
```

#### On single docker engine
```
docker run \
    -d --restart=always \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -e SLACK_URL="https://hooks.slack.com/services/YOUR_TOKEN_HERE"
    renatomachado/docker-monitoring:${VERSION}
```
