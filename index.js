const Docker = require('dockerode');
const https = require('https');
const docker = new Docker({socketPath: '/var/run/docker.sock'});

const config = require('./config.json');

async function start() {

    const listener = await docker.getEvents();
    listener.on('data', chunk => {

        let data = {};

        try {
            data = JSON.parse(chunk.toString());
        } catch (e) {
            console.log(e);
        }

        if (data.status === 'die' && data.Type === 'container') {
            // console.log(data);
            const postData = {text: `container ${data.Actor.Attributes.name} died at ${data.time}`};
            const postOpts = {
                hostname: 'hooks.slack.com',
                path: config.slackKey,
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
            };
            const req = https.request(postOpts, (res) => {
                console.log('statusCode:', res.statusCode);
                console.log('headers:', res.headers);

                res.on('data', (d) => {
                    console.log(d);
                });
            });

            req.on('error', (e) => {
                console.error(e);
            });

            req.write(JSON.stringify(postData));
            req.end();
        }

    });

}

start()
    .then(_ => {
        console.log('started');
    })
    .catch(err => {
        console.log(err);
        process.exit(1)
    });