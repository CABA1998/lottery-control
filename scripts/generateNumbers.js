import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import {
  getFirestore,
  doc,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import { firebaseConfig } from "./firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const raffleId = "rifa2025";

// Función para generar 1000 números en bloques de 100
async function generateNumbers() {
  const total = 1000;
  const batchSize = 100;
  const schema = {
    seller: "",
    status: "",
    buyer: "",
    buyer_contact: "",
  };

  for (let start = 0; start < total; start += batchSize) {
    const batch = writeBatch(db);

    for (let i = start; i < start + batchSize && i < total; i++) {
      const id = i.toString().padStart(3, "0");
      const ref = doc(db, `raffles/${raffleId}/numbers/${id}`);
      batch.set(ref, {
        ...schema,
        number: i,
      });
    }

    await batch.commit();
    console.log(`✅ Creados del ${start} al ${start + batchSize - 1}`);
  }

  console.log("🎉 ¡Todos los números fueron creados exitosamente!");
}

generateNumbers();
