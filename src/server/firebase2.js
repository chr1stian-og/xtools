const { initializeApp } = require("firebase/app");
const { getAuth } = require("firebase/auth");
const { getFirestore } = require("@firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyCwAp57crfhoB8ZQawyTiCTorpwXi1gQbM",
  authDomain: "xtools-24590.firebaseapp.com",
  projectId: "xtools-24590",
  storageBucket: "xtools-24590.appspot.com",
  messagingSenderId: "820500167691",
  appId: "1:820500167691:web:ee1d3480b0f8d810471b0e",
};

const app_auth = initializeApp(firebaseConfig);
const app_db = initializeApp(firebaseConfig);

const auth = getAuth(app_auth);
const db = getFirestore(app_db);

module.exports = { auth, db };
