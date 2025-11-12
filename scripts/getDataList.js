// Importa Firebase modular
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

import { firebaseConfig } from "./firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const output = document.getElementById("output");

async function loadData() {
  try {
    const snapshot = await getDocs(collection(db, "raffles/rifa2025/numbers"));
    const data = snapshot.docs.map((doc) => doc.data());
    console.log("Datos:", data);
    output.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    console.error("Error al leer:", err);
    output.textContent = "❌ Error al conectar con Firestore.\n" + err.message;
  }
}

loadData();
