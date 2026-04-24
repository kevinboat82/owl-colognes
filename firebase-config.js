// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyALrpEQqdHXAikzzdlNP_-o5pWtGkF9QAY",
  authDomain: "owl-colognes.firebaseapp.com",
  projectId: "owl-colognes",
  storageBucket: "owl-colognes.firebasestorage.app",
  messagingSenderId: "644119706219",
  appId: "1:644119706219:web:30efdee24df82bc268cf2e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };
