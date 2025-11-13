// Importar Firebase SDK modular
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import { firebaseConfig } from "./firebaseConfig.js";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Referencias del DOM
const container = document.getElementById("numbers-container");
const modal = document.getElementById("modal-backdrop");
const modalInfo = document.getElementById("modal-pair-info");
const confirmBtn = document.getElementById("confirm-btn");
const nameInput = document.getElementById("buyer-name");
const phoneInput = document.getElementById("buyer-phone");

let selectedPair = null;

// Extraer vendedor de la URL
const urlParams = new URLSearchParams(window.location.search);
const sellerParam = urlParams.get("seller") || "general";

// Lista de vendedores y sus números de WhatsApp
const sellerNumbers = {
  general: "573138256074",
  daniel: "573228731993",
  carlos: "16399948333",
};

const sellerPhone = sellerNumbers[sellerParam] || sellerNumbers.general;

// Cargar las parejas desde Firestore
async function loadPairs() {
  try {
    showLoader(); // ⬅️ Mostrar loading

    const snapshot = await getDocs(
      collection(db, "raffles", "rifa2025", "pairs")
    );
    const pairs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    renderPairs(pairs);
  } catch (err) {
    console.error("❌ Error cargando Firestore:", err);
    container.textContent = "Error al cargar los números. Intenta nuevamente.";
  } finally {
    hideLoader(); // ⬅️ Ocultar loading SIEMPRE, incluso si falla
  }
}

// Renderizar tablero
function renderPairs(pairs) {
  container.innerHTML = "";
  pairs.sort((a, b) => a.pair_id - b.pair_id);

  pairs.forEach((pair) => {
    const el = document.createElement("div");
    el.className = "pair " + (pair.status === "libre" ? "libre" : "ocupado");
    el.textContent = pair.numbers
      .map((n) => n.toString().padStart(3, "0"))
      .join(" - ");

    if (pair.status === "libre") {
      el.addEventListener("click", () => openModal(pair));
    }

    container.appendChild(el);
  });
}

// Abrir modal
function openModal(pair) {
  selectedPair = pair;
  modalInfo.textContent = `Números: ${pair.numbers
    .map((n) => n.toString().padStart(3, "0"))
    .join(" - ")}`;

  nameInput.value = "";
  phoneInput.value = "";
  modal.style.display = "flex";
}

// Confirmar y abrir WhatsApp
confirmBtn.addEventListener("click", () => {
  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();

  if (!name || !phone) {
    alert("Por favor completa tu nombre y teléfono.");
    return;
  }

  const message = encodeURIComponent(
    `Hola, quiero participar en la rifa con los siguientes números:\n` +
      `Números: ${selectedPair.numbers
        .map((n) => n.toString().padStart(3, "0"))
        .join(" - ")}\n` +
      `Nombre: ${name}\nTeléfono: ${phone}`
  );

  window.open(`https://wa.me/${sellerPhone}?text=${message}`, "_blank");
  modal.style.display = "none";
});

// Cerrar modal al hacer clic fuera
modal.addEventListener("click", (e) => {
  if (e.target === modal) modal.style.display = "none";
});
// --- BUSCAR PAREJA POR NÚMERO ---
const searchInput = document.getElementById("search-input");

searchInput.addEventListener("input", () => {
  const value = searchInput.value.trim();

  if (value.length === 0) {
    clearSearchHighlight();
    return;
  }

  // Convertir a número con padding
  const padded = value.padStart(3, "0");

  highlightPair(padded);
});

function highlightPair(number) {
  // Limpiar anteriores
  clearSearchHighlight();

  const allPairs = document.querySelectorAll(".pair");

  for (const pairEl of allPairs) {
    const text = pairEl.textContent.replace(/ /g, ""); // "123-567"

    if (text.includes(number)) {
      pairEl.classList.add("search-highlight");

      // Hacer scroll suave
      pairEl.scrollIntoView({ behavior: "smooth", block: "center" });
      break;
    }
  }
}

function clearSearchHighlight() {
  document
    .querySelectorAll(".search-highlight")
    .forEach((el) => el.classList.remove("search-highlight"));
}
// LOADER
const loader = document.getElementById("loader");

function showLoader() {
  loader.classList.remove("hidden");
}

function hideLoader() {
  loader.classList.add("hidden");
}

loadPairs();
