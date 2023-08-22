const Client = require("ssh2").Client;

function sendCommand(command, ip) {
  return new Promise((resolve, reject) => {
    let output = "";

    try {
      const conn = new Client();

      conn.on("ready", () => {
        conn.exec(command, (err, stream) => {
          if (err) {
            reject(err.message);
            return;
          }
          stream
            .on("data", (data) => {
              output += data.toString();
            })
            .on("close", (code, signal) => {
              conn.end();
              resolve(output);
            });
        });
      });

      conn.connect({
        host: ip,
        port: 2022,
        username: "moniTor",
        password: "#6C2a2B7D-8f8F-5Ff2-AE79-Eed904E5C214#", //nova
        // password: "#npOY7cpqCCB8AEA69wBLIVUQ04uEw6Xn#", //antiga
      });

      conn.on("error", (err) => {
        conn.end();
        reject(err.message);
      });

      conn.on("end", () => {
        resolve("Connection closed");
      });
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = sendCommand;
