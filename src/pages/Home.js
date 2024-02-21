import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { isIP, isIPv4 } from "is-ip";

const loading = require("../assets/loading.gif");
const loading2 = require("../assets/loading.gif");
const arrow = require("../assets/terminal.png");

const api = axios.create({
  baseURL: process.env.REACT_APP_LOCAL_API,
});

function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoading2, setIsLoading2] = useState(false);
  const [currentClient, setCurrentClient] = useState({ client: "" });
  const [result, setResult] = useState("");
  const [showDialog, setShowDialog] = useState({
    status: false,
    message: "",
    type: "",
  });

  const [command, setCommand] = useState("/getUser");
  const [user, setUser] = useState({
    email: "christian@gmail.com",
    password: "christian",
  });
  const [token, setToken] = useState("");
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const options = [
    "View interface",
    "Interface number",
    "Remove hack",
    "Reboot",
    "Reset password",
    // "Wifi and Password",
    "Get user",
    "Custom command",
    // "Test api",
  ];

  const [abortController, setAbortController] = useState(null);
  const controller = new AbortController();
  const abortSignal = controller.signal;

  const login = () => {
    try {
      api
        .post("/login", user)
        .then((res) => {
          setToken(res.data.accessToken);
          callDialog("success", "Logged in successfully!");
        })
        .catch((err) => {
          callDialog("error", err.response.data.error);
        });
    } catch (e) {
      console.log(e);
      callDialog("error", "Error while trying to login, try again");
    }
  };

  const callDialog = (type, message) => {
    setShowDialog({
      status: true,
      message: message,
      type: type,
    });
    setTimeout(() => {
      setShowDialog({ status: false, message: "", type: "" });
    }, 3000);
  };

  useEffect(
    () => {
      changeContact();
    },
    [selectedOptionIndex],
    [command]
  );

  useEffect(() => {
    // login();
    const controller = new AbortController();
    setAbortController(controller);
  }, []);

  function sendCommand() {
    if (currentClient && isIP(currentClient.trim())) {
      try {
        if (result === null || !isLoading) {
          setIsLoading(true);
          const timeoutPromise = new Promise((resolve, reject) => {
            setTimeout(() => {
              reject(new Error("Timeout occurred"));
            }, 30000);
          });
          Promise.race([
            api.post(command, currentClient, {
              signal: abortSignal,
            }),
            timeoutPromise,
          ])
            .then((resp) => {
              setResult(resp.data);
              setIsLoading(false);
            })
            .catch((err) => {
              setIsLoading(false);
              if (err.message === "Timeout occurred")
                document.getElementById("test-result").innerText =
                  "Timeout while waiting for a response";
              console.log(err.message);
            })
            .finally(() => {
              setAbortController(null);
            });
        }
      } catch (err) {
        setIsLoading(false);
        callDialog(
          "error",
          "Error occurred while reseting password, please check your internet connection"
        );
        console.log(err.message);
      }
    } else {
      callDialog("error", "Type an IP on the input box");
    }
  }

  function runDiagnosis() {
    if (currentClient && isIP(currentClient.client.trim())) {
      try {
        if (result === null || !isLoading2) {
          setResult("");
          setIsLoading2(true);
          const timeoutPromise = new Promise((resolve, reject) => {
            setTimeout(() => {
              reject(new Error("Timeout occurred"));
            }, 10000);
          });
          Promise.race([
            api.post("/runTest", currentClient, {
              signal: abortSignal,
            }),
            timeoutPromise,
          ])
            .then((resp) => {
              console.log("result data: " + JSON.stringify(resp.data));
              setResult(resp.data);
              setIsLoading2(false);
            })
            .catch((err) => {
              console.log("Error: " + err);
              setIsLoading2(false);
              if (err.message === "Timeout occurred") console.log(err.message);
              setResult("Could not connect");
              document.getElementById("test-result").innerHTML =
                "Could not connect";
            })
            .finally(() => {
              setAbortController(null);
            });
        }
      } catch (err) {
        setIsLoading2(false);
        callDialog(
          "error",
          "Error occurred while reseting password, please check your internet connection"
        );
        console.log(err.message);
      }
    } else {
      callDialog("error", "Type an IP on the input box");
    }
  }

  function changeContact() {
    const contactbox = document.getElementById("contact");
    var text = contactbox.options[contactbox.selectedIndex].text;
    document.getElementById("input-contact").type = text;
    // setResult(null);
    if (text === "Interface number") {
      setCommand("/getInterfaceNumber");
      document.getElementById("contact").value = "Interface number";
      document.getElementById("input-contact").focus();
    }
    if (text === "View interface") {
      setCommand("/getInterface");
      document.getElementById("contact").value = "View interface";
      document.getElementById("input-contact").focus();
    }
    if (text === "Remove hack") {
      setCommand("/removeHack");
      document.getElementById("contact").value = "Remove hack";
      document.getElementById("input-contact").focus();
    }
    if (text === "Reboot") {
      setCommand("/reboot");
      document.getElementById("contact").value = "Reboot";
      document.getElementById("input-contact").focus();
    }
    if (text === "Reset password") {
      setCommand("/resetPassword");
      document.getElementById("contact").value = "Reset password";
      document.getElementById("input-contact").focus();
    }
    if (text === "Wifi and Password") {
      setCommand("/getWifiNameAndPassword");
      document.getElementById("contact").value = "Wifi and Password";
      document.getElementById("input-contact").focus();
    }
    if (text === "Get user") {
      setCommand("/getUser");
      document.getElementById("contact").value = "Get user";
      document.getElementById("input-contact").focus();
    }
    if (text === "Get user") {
      // document.getElementById("custom-command").setVisibility = "true";
    }
    if (text === "Test api") {
      setCommand("/testapi");
      document.getElementById("contact").value = "Get user";
      document.getElementById("input-contact").focus();
    }
  }

  function handleKeyDown(event) {
    if (event.keyCode === 13) {
      if (abortSignal && abortSignal.aborted) stopTest();
      // else sendCommand();
      else runDiagnosis();
    }
    if (event.keyCode === 38) {
      setSelectedOptionIndex(Math.max(selectedOptionIndex - 1, 0));
      event.preventDefault();
    } else if (event.keyCode === 40) {
      setSelectedOptionIndex(
        Math.min(selectedOptionIndex + 1, options.length - 1)
      );
      event.preventDefault();
    }
  }

  const stopTest = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
  };

  const response = () => {
    if (result.isConnected) {
      console.log(result.speed.currentDownload);
      return `
        Signal: ${result.signal} \n
        Traffic: ${result.ethernetStatus === true ? "Running" : "Not running"}
        
        `;
    } else {
      return result.isConnected === false && `Could not connect to device`;
    }
  };

  return (
    <>
      <div className="h-screen">
        <Navbar />
        <div
          className={`${!showDialog.status ? "hidden" : "fixed"} alert ${
            showDialog.type === "success" ? "alert-success" : "alert-error"
          } shadow-lg z-50 w-fit bottom-4 right-4`}
        >
          <div>
            <span className="font-bold">{showDialog.message}</span>
          </div>
        </div>
        <h1 className="flex mt-10 mix-blend-overlay min-w-max font-bold text-3xl justify-center items-center align-center">
          Insert Client Info
        </h1>
        <div className="flex flex-col gap-4 justify-center items-center">
          <center className="rounded-lg mx-10">
            <div className="flex flex-col gap-4 mt-20 items-center backgroundColor-[#b05b5b] p-20 rounded-sm">
              <select
                id="contact"
                type="text"
                className="rounded-lg bg-[#dadada] hidden text-[#484848] text-md p-2  hover:cursor-pointer"
                onChange={changeContact}
                value={options[selectedOptionIndex]}
                onKeyDown={handleKeyDown}
              >
                {options.map((option, index) => (
                  <option
                    onChange={changeContact}
                    id="contact-options"
                    key={index}
                    value={option}
                  >
                    {option}
                  </option>
                ))}
              </select>
              <div className="flex flex-col sm:flex-row justify-center align-center items-center gap-4 ">
                <div className="flex flex-row gap-4 items-center">
                  <input
                    id="input-contact"
                    type="text"
                    maxLength={50}
                    onChange={(e) => {
                      setCurrentClient({ client: e.target.value });
                    }}
                    onKeyDown={handleKeyDown}
                    min={5}
                    pattern="\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}"
                    placeholder="Enter client IP"
                    className={` ${
                      result.status === "blue"
                        ? "input-info"
                        : result.status === "green"
                        ? "input-success"
                        : result.status === "orange"
                        ? "input-warning"
                        : result.status === "red"
                        ? "input-error"
                        : "border-[#1D283A] border-2"
                    } input input-bordered sm:w-full sm:min-w-[350px] sm:max-w-xs text-xl duration-500 hover:scale-105 transform-all`}
                  />
                </div>
                {/* <button
                  id="test-button"
                  type="submit"
                  onClick={() => sendCommand(currentClient)}
                  className={` ${
                    !isLoading ? "btn btn-error w-fit" : "block"
                  } duration-150 transition-all`}
                >
                  <img
                    src={arrow}
                    alt="button"
                    className={`w-[20px] ${!isLoading ? "block" : "hidden"}`}
                  />
                  <img
                    onClick={stopTest}
                    src={loading}
                    className={`w-[30px] ${
                      isLoading ? "block" : "hidden"
                    } hover:cursor-pointer`}
                  />
                </button> */}
                <button
                  id="test-button"
                  type="submit"
                  onClick={() => runDiagnosis(currentClient)}
                  className={` ${
                    !isLoading2
                      ? result.status === "blue"
                        ? "btn btn-info w-fit"
                        : result.status === "green"
                        ? "btn btn-success w-fit"
                        : result.status === "orange"
                        ? "btn btn-warning w-fit"
                        : result.status === "red"
                        ? "btn btn-error w-fit"
                        : "btn btn-neutral w-fit"
                      : "block"
                  } duration-150 hover:scale-105  transition-all`}
                >
                  <img
                    src={arrow}
                    alt="button"
                    className={`w-[20px] ${!isLoading2 ? "block" : "hidden"}`}
                  />
                  <img
                    onClick={stopTest}
                    src={loading2}
                    className={`w-[30px] ${
                      isLoading2 ? "block" : "hidden"
                    } hover:cursor-pointer`}
                  />
                </button>
              </div>
            </div>
          </center>
          <div
            className={` ${
              result
                ? // ? "mx-8 sm:mx-28  my-16 text-center flex items-center align-center justify-center px-10 py-20 bg-[#dadada] rounded-xl"
                  "text-center items-center align-center justify-center  rounded-xl"
                : "hidden"
            }`}
          >
            <h1
              id="test-result"
              className="flex mt-10 mix-blend-overlay min-w-max font-bold text-xl justify-center items-center align-center"
            >
              {/* <h1  className={`text-[#484848] text-xl font-bold`}> */}
              {response()}
            </h1>
          </div>
        </div>
      </div>
      <div className="absolute bottom-4 left-4">
        <h1 className="mix-blend-overlay text-white">
          @ Christian MacArthur, 2023
        </h1>
      </div>
    </>
  );
}

export default Home;
