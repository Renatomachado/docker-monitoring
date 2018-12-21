require("./config");

const Docker = require("dockerode");
const nconf = require("nconf");
const https = require("https");

const SLACK_URL = nconf.get("SLACK_URL");
const DOCKER_SOCKET_PATH = nconf.get("DOCKER_SOCKET_PATH");

const docker = new Docker({ socketPath: DOCKER_SOCKET_PATH });

if (!SLACK_URL) throw new Error("SLACK_URL not defined");

async function start() {
  const listener = await docker.getEvents();
  listener.on("data", chunk => {
    let data = {};

    try {
      data = chunk.toString().split("\n");
      data
        .filter(Boolean)
        .map(e => JSON.parse(e))
        .forEach(e => {
          if (e.status === "die" && e.Type === "container") {
            // console.log(data);
            senToSlack(e);
          }
        });
    } catch (e) {
      console.log(e);
    }
  });
}

const senToSlack = data => {
  const postData = {
    text: `_At ${new Date(
      data.time * 1000
    ).toLocaleString()}_: The container *${
      data.Actor.Attributes.name
    }* DIED with exitCode: *${data.Actor.Attributes.exitCode}*`
  };
  const postOpts = {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  };
  const req = https.request(SLACK_URL, postOpts, res => {
    res.on("data", d => {
      console.log(d);
    });
  });

  req.on("error", e => {
    console.error(e);
  });

  req.write(JSON.stringify(postData));
  req.end();
};

start()
  .then(_ => {
    console.log("started");
  })
  .catch(err => {
    console.log(err);
    process.exit(1);
  });
