// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAuPYozOUPo5CC-5-77s-hncCILmS9FCQ8",
  authDomain: "studyflow-6e7df.firebaseapp.com",
  projectId: "studyflow-6e7df",
  storageBucket: "studyflow-6e7df.firebasestorage.app",
  messagingSenderId: "200226504702",
  appId: "1:200226504702:web:1648a33346514dac840aaf",
  measurementId: "G-9DDWNL2V38"
};

// Initialize Firebase
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
 firebase.initializeApp(firebaseConfig);
}

// Connect Authentication
const auth = typeof firebase !== 'undefined' ? firebase.auth() : null;

// Connect Cloud Firestore
const db = typeof firebase !== 'undefined' ? firebase.firestore() : null;

// Expose globals explicitly on window
if (typeof window !== 'undefined') {
  window.auth = auth;
  window.db = db;
}

console.log("StudyFlow Firebase initialized successfully!"); 