import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "@firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCwAp57crfhoB8ZQawyTiCTorpwXi1gQbM",
  authDomain: "xtools-24590.firebaseapp.com",
  projectId: "xtools-24590",
  storageBucket: "xtools-24590.appspot.com",
  messagingSenderId: "820500167691",
  appId: "1:820500167691:web:ee1d3480b0f8d810471b0e"
};

const app_auth = initializeApp(firebaseConfig);
const app_db = initializeApp(firebaseConfig);

export const auth = getAuth(app_auth);
export const db = getFirestore(app_db);
