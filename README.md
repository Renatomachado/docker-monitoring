# Docker Monitoring

A service to capture when docker container dies and send a alert message to slack

## How to run
#### On swarm mode

```
docker service create \
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
    -e AMBIENT="PRODUCTION"
    renatomachado/docker-monitoring:${VERSION}
```


#### Optional environment for integration with Prometheus`s AlertManager
```
  -e ALERTMANAGER_HOST="alert manager address" \
  -e ALERTMANAGER_USER="alert manager user" \
  -e ALERTMANAGER_PASS="password" \
  -e ALERTMANAGER_LABELS="node_disk_usage,[others_labels]" \
```

