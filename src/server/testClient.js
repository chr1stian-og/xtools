const Client = require("ssh2").Client;
const conn = new Client();

function testClient(ip) {
  const promise = new Promise((resolve, reject) => {
    conn.on("ready", () => {
      conn.exec("/interface print count-only", (err, stream) => {
        if (err) {
          return reject("Error executing command: " + err.message);
        }

        let interfaceNumber = 0;
        let result = [];
        let output = null;

        stream.on("data", (data) => {
          output += data.toString();
        });

        stream.on("end", () => {
          interfaceNumber = parseInt(output);
        });

        if (interfaceNumber === 3 || interfaceNumber < 5) {
          result.push("Antena");

          conn.exec(
            // "/interface monitor-traffic interface=pppoe-out1 once",
            "/tool bandwidth-test address=10.225.227.222 direction=both duration=5 protocol=tcp user=CnetMozT2023 password=!@2023cneT#!",
            (err, stream) => {
              if (err) {
                return reject("Error executing command: " + err.message);
              }

              let outputData = "";

              stream.on("data", (data) => {
                console.log(data.toString());
                outputData += data.toString();
              });

              stream.on("end", () => {
                return resolve("finished test");
                // const Download = outputData.split(/\s+/)[6];
                // const Upload = outputData.split(/\s+/)[18];

                // console.log(Download);
                // console.log(Upload);
                // console.log(parseInt(Download));
                // console.log(parseInt(Upload));

                // if (parseInt(Download) && parseInt(Upload) > 20) {
                //   resolve("There is traffic on the link");
                // } else {
                //   resolve("There is no traffic on the link");
                // }
                // resolve("Download: " + Download + "\n" + "Upload: " + Upload);
                conn.end();
              });
            }
          );
        } else if (
          (interfaceNumber > 5 && interfaceNumber < 8) ||
          interfaceNumber < 2
        ) {
          result.push("Router");
          resolve("Router");
        } else {
          resolve("Could not determine the type of device");
        }
      });
    });

    conn.connect({
      host: ip,
      port: 2022,
      username: "christian",
      password: "#npOY7cpqCCB8AEA69wBLIVUQ04uEw6Xn#",
    });

    conn.on("error", (err) => {
      console.log("Promise error: " + err.message);
      resolve("Connection error: " + err.message);
      conn.end();
    });

    conn.on("end", () => {
      console.log("Connection closed");
      resolve("Connection closed");
    });
  });

  return promise;
}

module.exports = testClient;
