let discord = {
  url: `https://discord.com/api/webhooks/${discordWebhookID}/${discordWebhookToken}`,
  body: {
    username: "Codenames Teams",
    avatar_url: "https://cdn.discordapp.com/avatars/824452474236698647/1cc5a3127f858137a90bfe9649ee3574.png",
  },
  fetch: {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: "",
  },
};

let heroku = {
  url: `https://api.heroku.com/apps/${herokuAppName}/formation/${herokuFormationID}`,
  body: {
    quantity: "",
    size: "free",
  },
  fetch: {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/vnd.heroku+json; version=3",
      Authorization: `Bearer ${herokuBearer}`,
    },
  },
};

let type = "";
let i = 0;

async function handleRequest(req) {
  if (req.headers.get("User-Agent").includes("bot")) {
    return new Response("Blocking bot", { status: 403 });
  }
  let query = await new URL(req.url).pathname.substring(1);
  if (parseInt(query, 10)) {
    query = parseInt(query, 10);
    if (query < 0 || !Number.isInteger(query)) {
      return new Response("Invalid query number. Please make sure you input a positive integer", { status: 400 });
    }
  }

  let herokuStatus = await getHerokuStatus();
  let herokuRunning = herokuStatus.quantity;

  if (query === "status") {
    return new Response(JSON.stringify(herokuStatus));
  } else if (query > 0 && !herokuRunning) {
    discord.body.content = `Starting Codenames Teams bot for ${query} hour(s). You can stop the bot early by visiting https://${workerURL}/stop`;
    heroku.body.quantity = "1";
    // type = "start";
  } else if ((query === "stop" || query === "s") && herokuRunning) {
    discord.body.content = `Stopping Codenames Teams bot. You can restart the bot for an hour by visiting https://${workerURL}/1 or substitute \`1\` for another number of hours the bot should run.`;
    heroku.body.quantity = "0";
    // type = "stop";
  } else if ((query === "stop/n" || query === "sn" || query === "stopnomsg") && herokuRunning) {
    heroku.body.quantity = "0";
    type = "stopnomsg";
  } else {
    return new Response("Invalid query", { status: 400 });
  }

  discord.fetch.body = JSON.stringify(discord.body);
  heroku.fetch.body = JSON.stringify(heroku.body);

  let herokuResponse = await fetch(heroku.url, heroku.fetch);
  if (!type) {
    let discordcall = await fetch(discord.url, discord.fetch);
  }
  return new Response("Success");
}

async function getHerokuStatus() {
  let status = await fetch(heroku.url, heroku.fetch);
  let statusJSON = await status.json();
  heroku.fetch.method = "PATCH";
  return statusJSON;
}

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

addEventListener("scheduled", (event) => {
  event.wait(async () => {
    let type = "stopnomsg";
    heroku.body.quantity = "0";
    await makeCallResponse(type);
  });
});
