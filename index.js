const Discord = require("discord.js");
const client = new Discord.Client();
require("dotenv").config();
client.login(process.env.discordToken)

// Temp, not sure why these were ever env variables when they don't need to be protected?
let redRoleID = process.env.redRoleID;
let blueRoleID = process.env.blueRoleID;
let spymasterRoleID = process.env.spymasterRoleID

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.guilds.cache.get(process.env.serverID).members.fetch();
});

client.on("message", (message) => {
  let input = (function () {
    let content = message.content.toLowerCase();

    if (content.startsWith("!cn ")) content = content.substring(4).split(" ");
    else if (content.startsWith("!codenames ")) content = content.substring(11).split(" ");
    else return false;

    let parsed = {};

    parsed.command = content[0];
    parsed.targets = [];
    parsed.flags = {};

    content.shift();
    content.forEach((str, index) => {
      if (str.startsWith("--")) {
        let key = str.substring(2);
        let val = content[index + 1];
        content.shift();
        parsed.flags[key] = val;
      } else {
        parsed.targets.push(str);
      }
    });
    if (!parsed.targets.length) parsed.targets.push(null);

    return parsed;
  })();

  if (!input) return;

  let role;

  switch (input.command) {
    case "assign":
      message.channel.send(`\`${input.command}\` is not setup yet.`);
      break;
    case "list":
      list(message)
      // message.channel.send(`\`${input.command}\` is not setup yet.`);
      break;
    case "add":
      role = input.targets[0];
      input.targets.shift();
      if (input.targets.length === 0) {
        message.channel.send("Sorry, you didn't specify a team to add the user(s) to. Options are `red`, `blue`, or `spymaster`");
      } else {
        input.targets.forEach((target) => {
          add(message, role, target);
        });
      }
      break;
    case "remove":
      role = input.targets[0];
      input.targets.shift();
      if (input.targets.length === 0) {
        message.channel.send("Sorry, you didn't specify a team to remove the user(s) from. Options are `red`, `blue`, or `spymaster`");
      } else {
        input.targets.forEach((target) => {
          remove(message, role, target);
        });
      }
      break;
    case "reset":
      input.targets.forEach((target) => {
        reset(message, target);
      });
      break;
    case "help":
      help(message, input.targets);
      break;
    case "ping":
      ping(message);
      break;
    default:
      message.channel.send(`\`${input.command}\` is either not a valid command or not setup yet.`);
  }
});

function assign() {}

function list(message) {
  let redSpymaster, blueSpymaster, redTeam, blueTeam, spymasterIDs;
  try {
    redTeam = message.guild.roles.cache.get(redRoleID).members.map(m => ({ [m.id]: m.nickname }));
    redTeam = Object.assign(...redTeam)
  } catch {
    redTeam = {}
  }

  try {
    blueTeam = message.guild.roles.cache.get(blueRoleID).members.map(m => ({ [m.id]: m.nickname }));
    blueTeam = Object.assign(...blueTeam)
  } catch {
    blueTeam = {}
  }

  try {
    spymasterIDs = message.guild.roles.cache.get(spymasterRoleID).members.map(m => m.id);
  } catch {
    spymasterIDs = []
  }


  if (spymasterIDs[0] && redTeam[spymasterIDs[0]]) {
    if (spymasterIDs[0]) redSpymaster = { [spymasterIDs[0]]: redTeam[spymasterIDs[0]] };
    if (spymasterIDs[1]) blueSpymaster = { [spymasterIDs[1]]: blueTeam[spymasterIDs[1]] };
    delete redTeam[spymasterIDs[0]];
    delete blueTeam[spymasterIDs[1]];
  } else if (spymasterIDs[0] && redTeam[spymasterIDs[1]]) {
    if (spymasterIDs[1]) redSpymaster = { [spymasterIDs[1]]: redTeam[spymasterIDs[1]] };
    if (spymasterIDs[0]) blueSpymaster = { [spymasterIDs[0]]: blueTeam[spymasterIDs[0]] };
    delete redTeam[spymasterIDs[1]];
    delete blueTeam[spymasterIDs[0]];
  }
  
  let listMsg = `
\`\`\`diff
-(っ◔◡◔)っ ♥ Red Team! ♥
-~ Spymaster ~ => ${redSpymaster ? Object.values(redSpymaster)[0] : ""}
-~* Players *~-
-${Object.values(redTeam).join("\n-")}
\`\`\`

\`\`\`ini
[♥ Blue Team! ♥ (⊂◕‿◕⊂)]
[~ Spymaster ~ => ${blueSpymaster ? Object.values(blueSpymaster)[0] : ""}]
[~* Players *~]
[${Object.values(blueTeam).join("]\n[")}]
\`\`\`
`
  
  message.channel.send(listMsg)
}

function add(message, role, target) {
  let memberID = prepTarget(target, "adding");
  if (role === "red" && memberID) {
    message.guild.members.fetch(memberID).then((member) => {
      member.roles.remove(blueRoleID);
      member.roles.add(redRoleID);
    });
  } else if (role === "blue" && memberID) {
    message.guild.members.fetch(memberID).then((member) => {
      member.roles.remove(redRoleID);
      member.roles.add(blueRoleID);
    });
  } else if ((role === "spymaster" || role === "spymasters") && memberID) {
    message.guild.members.fetch(memberID).then((member) => {
      member.roles.add(spymasterRoleID);
    });
  } else {
    message.channel.send(`Sorry, the \`${role}\` team selected for role adding is invalid. Options are \`red\`, \`blue\`, or \`spymaster\``);
  }
}

function remove(message, role, target) {
  let memberID = prepTarget(target, "removing");
  if (role === "red" && memberID) {
    message.guild.members.fetch(memberID).then((member) => {
      member.roles.remove(redRoleID);
    });
  } else if (role === "blue" && memberID) {
    message.guild.members.fetch(memberID).then((member) => {
      member.roles.remove(blueRoleID);
    });
  } else if ((role === "spymaster" || role === "spymasters") && memberID) {
    message.guild.members.fetch(memberID).then((member) => {
      member.roles.remove(spymasterRoleID);
    });
  } else {
    message.channel.send(`Sorry, the \`${role}\` team selected for role removing is invalid. Options are \`red\`, \`blue\`, or \`spymaster\``);
  }
}

function reset(message, target) {
  if (target === null) {
    reset(message, "red");
    reset(message, "blue");
    reset(message, "spymaster");
  } else if (target.startsWith("<@!")) {
    let memberID = target.substring(3).slice(0, -1);
    message.guild.members.fetch(memberID).then((member) => {
      member.roles.remove(redRoleID);
      member.roles.remove(blueRoleID);
      member.roles.remove(spymasterRoleID);
    });
  } else if (target === "red") {
    message.guild.roles.fetch(redRoleID).then((role) => {
      role.members.array().forEach((member) => {
        member.roles.remove(redRoleID);
      });
    });
  } else if (target === "blue") {
    message.guild.roles.fetch(blueRoleID).then((role) => {
      role.members.array().forEach((member) => {
        member.roles.remove(blueRoleID);
      });
    });
  } else if (target === "spymaster" || target === "spymasters") {
    message.guild.roles.fetch(spymasterRoleID).then((role) => {
      role.members.array().forEach((member) => {
        member.roles.remove(spymasterRoleID);
      });
    });
  } else {
    message.channel.send(`Sorry, the \`${target}\` target for role resetting is invalid.`);
  }
}

function help(message, targets) {
  let helpResponse = `
\`\`\`
CN Roles: Red, Blue, Spymaster

!cn reset = resets all CN roles for all members
!cn reset [role] = removes all users from role
!cn reset @member ... = resets all CN roles for users tagged

!cn add [role] @member ... = adds role to users tagged

!cn remove [role] @member ... = removes role from users tagged\`\`\``;

  if (targets.length > 0) helpResponse = [...targets] + helpResponse;

  message.channel.send(helpResponse);
}

function ping(message) {
  message.channel.send("Pong!");
}

//#region helper functions

function prepTarget(target, operation) {
  if (target.startsWith("<@!")) {
    return target.substring(3).slice(0, -1);
  } else {
    message.channel.send(`Sorry, the \`${target}\` target for ${operation} a role doesn't appear to be a user and is invalid.`);
    return null;
  }
}

//#endregion helper functions
