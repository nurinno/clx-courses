// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBHZ5y08F09WqFBZ2F61OL17vZR2gF-yMA",
  authDomain: "cluster-courses.firebaseapp.com",
  projectId: "cluster-courses",
  storageBucket: "cluster-courses.firebasestorage.app",
  messagingSenderId: "282047302850",
  appId: "1:282047302850:web:e831dff4121b790f51ff5b",
  measurementId: "G-FKZJ68D981"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);