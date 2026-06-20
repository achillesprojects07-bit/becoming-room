// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC6KHF9c_lwy-sKZM5VSA-tmydKc42zmEE",
  authDomain: "becoming-room.firebaseapp.com",
  projectId: "becoming-room",
  storageBucket: "becoming-room.firebasestorage.app",
  messagingSenderId: "646188920622",
  appId: "1:646188920622:web:002469d2d681824a7214bf",
  measurementId: "G-G8KNYMGFZ9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
