import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import {
  getFirestore,
  doc,
  writeBatch,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

import { firebaseConfig } from "./firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const raffleId = "rifa2025";

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function generatePairs() {
  const numbers = Array.from({ length: 1000 }, (_, i) => i);
  shuffleArray(numbers);

  const totalPairs = 500;
  const batchSize = 100;
  let pairCount = 0;

  for (let start = 0; start < totalPairs; start += batchSize) {
    const batch = writeBatch(db);

    for (let i = start; i < start + batchSize && i < totalPairs; i++) {
      const n1 = numbers[i * 2];
      const n2 = numbers[i * 2 + 1];
      const pairId = i + 1;
      const id = pairId.toString().padStart(3, "0");

      const ref = doc(db, `raffles/${raffleId}/pairs/${id}`);
      batch.set(ref, {
        pair_id: pairId,
        numbers: [n1, n2],
        status: "libre",
        buyer: "",
        contact: "",
        seller: "",
        price: 10000,
        created_at: serverTimestamp(),
      });
      pairCount++;
    }

    await batch.commit();
    console.log(`✅ Creadas ${pairCount} parejas hasta ahora`);
  }

  console.log("🎉 ¡500 parejas aleatorias creadas exitosamente!");
}

generatePairs();
