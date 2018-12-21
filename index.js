require("./config");

const Docker = require("dockerode");
const nconf = require("nconf");
const https = require("https");
const http = require("http");

const SLACK_URL = nconf.get("SLACK_URL");
const DOCKER_SOCKET_PATH = nconf.get("DOCKER_SOCKET_PATH");
const AMBIENT = nconf.get("AMBIENT");
const ALERTMANAGER_HOST = nconf.get("ALERTMANAGER_HOST");
const ALERTMANAGER_USER = nconf.get("ALERTMANAGER_USER");
const ALERTMANAGER_PASS = nconf.get("ALERTMANAGER_PASS");
const ALERTMANAGER_LABELS = nconf.get("ALERTMANAGER_LABELS").split(",");

const docker = new Docker({ socketPath: DOCKER_SOCKET_PATH });

if (!SLACK_URL) throw new Error("SLACK_URL not defined");

const request = (url, options) =>
  new Promise((resolve, reject) => {
    const protocol = (/^https/.test(url) && https) || http;

    const req = protocol.request(url, options, res => {
      res.on("data", resolve);
    });
    req.on("error", reject);

    if (options.body) req.write(options.body);
    req.end();
  });

const getMessageForDockerDie = data => ({
  text: `_At ${new Date(data.time * 1000).toLocaleString()}_: The container *${
    data.Actor.Attributes.name
  }* in *${AMBIENT}*, DIED with exit code: *${data.Actor.Attributes.exitCode}*`
});

const getMessageForAlertmanager = data => ({
  text: `_At ${new Date(data.startsAt).toLocaleString()}_: *${
    data.labels.alertname
  }* \n ${data.annotations.description} ${
    data.annotations.summary ? `\n ${data.annotations.summary}` : ""
  }`
});

const startDockerListener = async () => {
  const listener = await docker.getEvents();
  listener.on("data", chunk => {
    let data = {};

    try {
      data = chunk.toString().split("\n");
      data
        .filter(Boolean)
        .map(e => JSON.parse(e))
        .forEach(async e => {
          if (e.status === "die" && e.Type === "container") {
            await sendToSlack(JSON.stringify(getMessageForDockerDie(e)));
          }
        });
    } catch (e) {
      console.log(e);
    }
  });
};

const byAlert = alert => {
  if (!ALERTMANAGER_LABELS.length) return alert;
  return ALERTMANAGER_LABELS.includes(alert.labels.alertname);
};

const byActiveStatus = alert => {
  return alert.status.state === "active";
};

const startAlertmanagerListener = async () => {
  if (!ALERTMANAGER_HOST) return;

  try {
    const auth = ALERTMANAGER_USER &&
      ALERTMANAGER_PASS && {
        auth: `${ALERTMANAGER_USER}:${ALERTMANAGER_PASS}`
      };
    const response = await request(`${ALERTMANAGER_HOST}/api/v1/alerts`, {
      method: "GET",
      ...auth
    });
    const alerts = JSON.parse(response.toString());

    if (alerts.status === "success") {
      await Promise.all(
        alerts.data
          .filter(byAlert)
          .filter(byActiveStatus)
          .map(e => sendToSlack(JSON.stringify(getMessageForAlertmanager(e))))
      );
    }
  } catch (err) {
    console.log("ALERTMANAGER ERROR:", err);
  }

  setTimeout(startAlertmanagerListener, 30000);
};

const sendToSlack = message => {
  const postOpts = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: message
  };

  return request(SLACK_URL, postOpts);
};

Promise.all([startDockerListener(), startAlertmanagerListener()])
  .then(_ => {
    console.log("started");
  })
  .catch(err => {
    console.log(err);
    process.exit(1);
  });
