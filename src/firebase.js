import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDsx74IRIMYOAQ2nxk3sIePlsPLZ4H3K9A",
  authDomain: "iit-portal.firebaseapp.com",
  projectId: "iit-portal",
  storageBucket: "iit-portal.firebasestorage.app",
  messagingSenderId: "246658745051",
  appId: "1:246658745051:web:8b5efc39c85f16b2a3c2fe",
  measurementId: "G-XN6CHQ9EMP"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
