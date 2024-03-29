require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sendCommand = require("./sendCommand");
const testClient = require("./testClient");
const jwt = require("jsonwebtoken");
// const firebaseAuth = require("firebase-admin");
// const credentials = require("./firebase-credentials.json");
// const { auth } = require("./firebase2.js");
// const { signInWithEmailAndPassword } = require("firebase/auth");
const axios = require("axios");
const https = require("https");
const fs = require("fs");

//Firebase
// firebaseAuth.initializeApp({
//   credential: firebaseAuth.credential.cert(credentials),
// });

//express
const app = express();
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));
app.use(timeoutMiddleware);
app.use(cors());

//Global
const PORT = process.env.PORT || 3001;
let TOKEN = "no token";

// ssl server;
// const options = {
//   key: fs.readFileSync(
//     "/etc/letsencrypt/live/christianmacarthur.com/privkey.pem"
//   ),
//   cert: fs.readFileSync(
//     "/etc/letsencrypt/live/christianmacarthur.com/cert.pem"
//   ),
//   ca: fs.readFileSync("/etc/letsencrypt/live/christianmacarthur.com/chain.pem"),
// };
// https.createServer(options, app).listen(PORT, () => {
//   console.log(`Secure server running on port ${PORT}...`);
// });

//unsecure server
try {
  app.listen(PORT, () => console.log(`Backend on port ${PORT}...`));
} catch (e) {
  console.log(
    "An error ocurred with the server. Read the error log for more details.",
    e.message
  );
}

//functions
function sendResponse(res, status, text, err) {
  !res.headersSent &&
    (console.log("Sending response:", text + (err ? " " + err : "")),
    res.status(status).json(text + (err ? " " + err : "")));
}

function timeoutMiddleware(req, res, next) {
  const timer = 6000;

  let responseSent = false;
  const timeoutTimer = setTimeout(() => {
    if (!responseSent) {
      responseSent = true;
      return res.json("Timeout");
    }
  }, timer);

  const originalJson = res.json;
  res.json = function (data) {
    if (!responseSent) {
      responseSent = true;
      clearTimeout(timeoutTimer);
      originalJson.call(res, data);
    }
  };

  next();
}

// const authenticateToken = (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   if (TOKEN === null) return res.json("Access denied, Log in first");

//   jwt.verify(TOKEN, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
//     if (err) return res.json("Token is invalid, Log in.");
//     req.user = user;
//     next();
//   });
// };

// const testToken = (res) => {
//   axios
//     .get("http://xtools.christianmacarthur/api/testToken", {
//       headers: {
//         authorization: TOKEN,
//       },
//     })
//     .then((response) => {
//       return res.json(response.data);
//     })
//     .catch((error) => {
//       console.error(error);
//       return res.status(403).json("Token is invalid");
//     });
// };

//endpoints
app.get("/api/test", (req, res) => {
  res.json("Hello World");
});

app.post("/api/testapi", (req, res) => {
  const { client } = req.body;
  res.json(`API is working. IP received is ${client}`);
});

app.get("/api/testToken", (req, res) => {
  res.json("Token is valid");
});

// app.post("/api/signin", async (req, res) => {
//   const { email, password } = req.body || {
//     email: "christian@gmail.com",
//     password: "christian",
//   };

//   try {
//     const userResponse = await firebaseAuth.auth().createUser({
//       email: email,
//       password: password,
//       emailVerified: true,
//       disabled: false,
//     });
//     return res.json(userResponse);
//   } catch (e) {
//     console.log(e);
//     return res.json(e.message);
//   }
// });

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body || {
    email: "christian@gmail.com",
    password: "christian",
  };

  const isLoggedIn = auth.currentUser;
  if (isLoggedIn) {
    return res.json({ accessToken: TOKEN });
  }

  try {
    const login = await signInWithEmailAndPassword(auth, email, password);

    if (login) {
      const options = {
        expiresIn: "10m",
      };

      const accessToken = jwt.sign(
        { email, password },
        process.env.ACCESS_TOKEN_SECRET,
        options
      );
      TOKEN = accessToken;
      return res.status(200).json({ accessToken: accessToken });
    }
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
});

app.post("/api/getInterfaceNumber", async (req, res) => {
  const { client } = req.body;
  console.log("getting the number of interfaces of", client, "...");
  try {
    await sendCommand(
      "/interface print count-only",
      client.toString(10).trim()
    ).then((output) => {
      const response = {
        number: output,
        type: output === 1 ? "interface" : "interfaces",
      };
      return res.status(200).json(response.number + response.type);
    });
  } catch (e) {
    console.log(e);
    return res.json("Unable to complete request");
  }
});

app.post("/api/getInterface", async (req, res) => {
  const { client } = req.body;
  console.log("getting interface of", client, "...");

  try {
    await sendCommand("/interface print", client.toString(10).trim()).then(
      (output) => {
        return res.status(200).json(output);
      }
    );
  } catch (e) {
    console.log(e);
    return res.json("Unable to complete request");
  }
});

app.post("/api/resetPassword", async (req, res) => {
  const { client } = req.body;
  console.log("resetting ", client, "password ...");

  try {
    await sendCommand(
      "/interface pppoe-client set password=Alterar21#",
      client.toString(10).trim()
    ).then((output) => {
      return res.status(200).json("Password set to 'Alterar21#' " + output);
    });
  } catch (e) {
    console.log(e);
    return res.json("Unable to complete request");
  }
});

app.post("/api/runTest", async (req, res) => {
  const { client } = req.body || {};
  console.log("Testing ", client.toString(10).trim(), "...");

  testClient(client.toString(10).trim())
    .then((result) => {
      console.log(JSON.stringify(result));
      res.json(result);
    })
    .catch((error) => {
      console.log(error.message);
      return res.status(500).json("Unable to complete request");
    });
});

app.post("/api/getWifiNameAndPassword", async (req, res) => {
  const { client } = req.body;
  console.log("client: ", client, "...");
  let result = [];
  let interfaceNumber = 0;
  try {
    await sendCommand(
      "/interface print count-only",
      client.toString(10).trim()
    ).then((output) => {
      interfaceNumber = parseInt(output);
    });

    if (interfaceNumber === 3) {
      return res.json("Not a router");
    } else if (interfaceNumber > 3) {
      await sendCommand(
        "/interface wireless print",
        client.toString(10).trim()
      ).then((output) => {
        result.push("WIFI" + output);
      });
      await sendCommand(
        "/interface wireless security-profiles print",
        client.toString(10).trim()
      ).then((output) => {
        result.push(output);
      });
      return res.json(result);
    } else {
      console.log(result);
      return res.json("could not determine number of interfaces");
    }
  } catch (e) {
    console.log(e);
    return res.json("Unable to complete request");
  }
});

app.post("/api/removeHack", async (req, res) => {
  const { client } = req.body;
  console.log("removing hack of: ", client, "...");

  let result = [];
  let interfaceNumber = 0;
  try {
    await sendCommand(
      "/ppp profile set 0 local-address=0.0.0.0 remote-address=0.0.0.0",
      client.toString(10).trim()
    ).then((output) => {
      result.push(output);
    });

    await sendCommand("/ppp secrets remove 0", client.toString(10).trim()).then(
      (output) => {
        result.push(output);
      }
    );

    await sendCommand(
      "/interface print count-only",
      client.toString(10).trim()
    ).then((output) => {
      interfaceNumber = parseInt(output);
    });

    if (interfaceNumber === 3) {
      await sendCommand(
        "/interface disable 2",
        client.toString(10).trim()
      ).then((output) => {
        result.push(output);
      });
      await sendCommand("/interface enable 2", client.toString(10).trim()).then(
        (output) => {
          result.push(output);
        }
      );
      return res.json("The hack has been successfuly removed");
    } else if (interfaceNumber > 3) {
      return res.json("More than 3 interfaces");
    } else {
      console.log(result);
      return res.json("could not determine number of interfaces");
    }
  } catch (e) {
    console.log(e);
    return res.json("Unable to complete request");
  }
});

app.post("/api/reboot", async (req, res) => {
  const { client } = req.body;
  console.log("rebooting ", client, "...");
  let result = [];
  try {
    await sendCommand("/system reboot", client.toString(10).trim()).then(
      (output) => {
        result.push(output);
      }
    );
    // await sendCommand("y", client.toString(10).trim()).then((output) => {
    //   result.push(output);
    // });
    return res.json(result);
  } catch (e) {
    console.log(e);
    return res.json("Unable to complete request");
  }
});

app.post("/api/getUser", async (req, res) => {
  const { client } = req.body;
  console.log("getting the user of", client, "...");
  try {
    await sendCommand(
      "/interface pppoe-client print",
      client.toString(10).trim()
    ).then((output) => {
      var startIndex = output.indexOf('user="') + 6;
      var endIndex = output.indexOf('"', startIndex);
      var userName = output.substring(startIndex, endIndex);
      return res.status(200).json(userName);
    });
  } catch (e) {
    console.log(e);
    return res.json("Unable to complete request");
  }
});
