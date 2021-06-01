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
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/vnd.heroku+json; version=3",
      Authorization: `Bearer ${herokuBearer}`,
    },
    body: "",
  },
};

async function handleRequest(req) {
  let query = await new URL(req.url).pathname.substring(1);
  let type = "";

  if (query < 0 || !Number.isInteger(query)) return new Response("Invalid query number. Please make sure you input a positive integer", { status: 400 });

  let herokuRunning = await (async () => {
    let checkStatus = await fetch("https://cn.arimgibson.com/status");
    let statusJSON = await checkStatus.json();
    return statusJSON.quantity;
  })();

  if (query > 0 && !herokuRunning) {
    discord.body.content = `Starting Codenames Teams bot for ${query} hour(s). You can stop the bot early by visiting https://${workerURL}/stop`;
    heroku.body.quantity = "1";
    type = "start";
  } else if ((query === "stop" || query === "s") && herokuRunning) {
    discord.body.content = `Stopping Codenames Teams bot. You can restart the bot for an hour by visiting https://${workerURL}/1 or substitute \`1\` for another number of hours the bot should run.`;
    heroku.body.quantity = "0";
    type = "stop";
  } else if (query === "status") {
    heroku.fetch.method = "GET";
    delete heroku.body;
    type = "status";
  } else if ((query === "stop/n" || query === "sn") && herokuRunning) {
    heroku.body.quantity = "0";
    type = "stopnomsg";
  } else {
    return new Response("Invalid query", { status: 400 });
  }

  discord.fetch.body = JSON.stringify(discord.body);
  heroku.fetch.body = JSON.stringify(heroku.body);
  let makeCallResponse = await makeCall(type);

  if (makeCallResponse) return new Response(makeCallResponse, { status: 200 });
  else return new Response("Success", { status: 200 });
}

async function makeCall(type) {
  let herokuResponse = await fetch(heroku.url, heroku.fetch);
  let herokuJSON = await herokuResponse.json();

  if (type === "status") {
    return JSON.stringify(herokuJSON);
  } else if (type === "stopnomsg") {
    return;
  } else {
    await fetch(discord.url, discord.fetch);
  }
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
