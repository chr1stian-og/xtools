const Client = require("ssh2").Client;
const math = require("mathjs");
const conn = new Client();

async function testClient(ip) {
  let result = {
    isConnected: false, //check if connection to device was sucessfully
    deviceType: "", //determine if it is a router or antenna based on number of interfaces
    interfaceNumber: 0, //check the numeber of interfaces
    ethernetStatus: false, //check if ehter1 connected, running and if has traffic
    signal: 0, //check the signal and its qualisty if it is a antenna
    hasInternetConnection: false, //do a ping to 8.8.8.8 to see if it can connect to the internet
    speed: {
      currentDownload: "", //current Download speed
      currentUpload: "", //current Upload speed
      maxDownload: "", //maximum bandwith test Download speed
      maxUpload: "", //maximum bandwith test Upload speed
    },
    isHacked: false, //check if the device is hacked
    isRouterConnected: false, //check if the router is connected
    routerboard: "", //check the routerboard version
    gotRoute: false, //check if the router has a route to its gateway
    status: "gray", //blue, green, yellow, orange, red, gray
  };

  const promise = new Promise((resolve, reject) => {
    // const connectionTimeout = 10000;

    conn.connect({
      host: ip,
      port: 2022,
      username: "moniTor",
      password: "#6C2a2B7D-8f8F-5Ff2-AE79-Eed904E5C214#",
    });

    // const timeoutTimer = setTimeout(() => {
    //   result.isConnected = false;
    //   conn.end();
    // }, connectionTimeout);

    conn.on("ready", () => {
      console.log("cleared the timer on ready");
      // clearTimeout(timeoutTimer);

      result.isConnected = true;

      conn.exec(
        "put [/system routerboard get value-name=current-firmware]",
        (err, stream) => {
          if (err) {
            return reject("Error executing command: " + err.message);
          }

          let outputData = "";

          stream.on("data", (data) => {
            outputData += data.toString();
          });

          stream.on("end", () => {
            result.routerboard = outputData;
          });
        }
      );

      conn.exec("/interface print count-only", (err, stream) => {
        if (err) {
          return reject("Error executing command: " + err.message);
        }

        stream.on("data", (data) => {
          result.interfaceNumber += parseInt(data.toString());
        });

        stream.on("end", () => {});

        if (result.interfaceNumber === 3 || result.interfaceNumber < 5) {
          result.deviceType = "Antenna\r\n";

          conn.exec(
            "/interface monitor-traffic interface=pppoe-out1 once",
            // "/tool bandwidth-test address=10.225.227.222 direction=both duration=5 protocol=tcp user=CnetMozT2023 password=!@2023cneT#!",
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
                const Download = outputData.split(/\s+/)[6];
                const Upload = outputData.split(/\s+/)[18];

                console.log(
                  "Download: " + Download + "\n" + "Upload: " + Upload
                );
                result.speed.currentDownload = Download;
                result.speed.currentUpload = Upload;
                console.log(Download);
                console.log(Upload);
              });
            }
          );

          conn.exec(
            "put [/interface wireless registration-table get value-name=signal-strength 0]",
            (err, stream) => {
              if (err) {
                reject("Error Executing command: " + err.message);
              }

              let outputData = "";
              stream.on("data", (data) => {
                outputData += data.toString();
              });

              stream.on("end", () => {
                result.signal = outputData;
              });
            }
          );

          conn.exec(
            " /interface print where name='ether1' running",
            (err, stream) => {
              if (err) {
                return reject("Error Executing command: " + err.message);
              }

              let outputData = "";
              stream.on("data", (data) => {
                outputData += data.toString();
              });

              stream.on("end", () => {
                if (outputData) {
                  result.ethernetStatus = true;
                }
              });
              conn.end();
            }
          );
        } else if (
          (interfaceNumber > 5 && interfaceNumber < 8) ||
          interfaceNumber < 2
        ) {
          result.deviceType = "Device type: Router";
          conn.end();
        } else {
          result.deviceType = "Could not determine the type of device";
          conn.end();
        }
      });
    });

    conn.on("error", (err) => {
      // clearTimeout(timeoutTimer);

      result.isConnected = false;

      if (err.code === "ETIMEDOUT") {
        console.log("Connection to " + ip + " timed out.");
      } else if (err.code === "ECONNREFUSED") {
        console.log("Connection to " + ip + " was refused.");
      } else {
        // Handle other types of errors
        console.log("Error message: " + err.message);
      }
      return resolve(result);
    });

    conn.on("end", () => {
      // clearTimeout(timeoutTimer);

      const signal = parseInt(result.signal);
      const currentDownload = parseInt(result.speed.currentDownload);
      const currentUpload = parseInt(result.speed.currentUpload);

      if (result.isConnected) {
        if (signal < -70 || !result.ethernetStatus) {
          result.status = "red";
        } else if (signal > -70 && signal < -62) {
          result.status = "orange";
        } else if (signal > -62 && signal < -55) {
          result.status = "green";
        } else if (signal > -55 && result.ethernetStatus) {
          result.status = "blue";
        } else {
          result.status = "red";
        }
      } else {
        result.status = "red";
      }

      resolve(result);
    });
  });

  return promise;
}

module.exports = testClient;
