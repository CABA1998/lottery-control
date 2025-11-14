// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

import { firebaseConfig } from "./firebaseConfig.js";

// Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM
const container = document.getElementById("numbers-container");
const modal = document.getElementById("modal-backdrop");
const modalTitle = document.getElementById("modal-title");
const selectedNumbersBox = document.getElementById("selected-numbers");
const statusSelect = document.getElementById("status-select");
const pinInput = document.getElementById("admin-pin");
const updateBtn = document.getElementById("admin-update-btn");
const modalError = document.getElementById("modal-error");
const modalSuccess = document.getElementById("modal-success");

let selectedPair = null;

// PIN de seguridad
const ADMIN_PIN = "2025";

// Filtrar por vendedor
const urlParams = new URLSearchParams(window.location.search);
const sellerFilter = urlParams.get("seller") || null;

// Loader
const loader = document.getElementById("loader");
const showLoader = () => loader.classList.remove("hidden");
const hideLoader = () => loader.classList.add("hidden");

// Cargar boletas
async function loadPairs() {
  try {
    showLoader();
    const snapshot = await getDocs(
      collection(db, "raffles", "rifa2025", "pairs")
    );
    let pairs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (sellerFilter) {
      pairs = pairs.filter((p) => p.seller === sellerFilter);
    }

    renderPairs(pairs);
  } catch (err) {
    console.error(err);
    container.innerHTML = "Error cargando datos.";
  } finally {
    hideLoader();
  }
}

// Renderizar
function renderPairs(pairs) {
  container.innerHTML = "";
  pairs.sort((a, b) => a.pair_id - b.pair_id);

  pairs.forEach((pair) => {
    const el = document.createElement("div");
    el.className = `pair ${pair.status}`;

    el.textContent = pair.numbers
      .map((n) => n.toString().padStart(3, "0"))
      .join(" - ");

    if (pair.status !== "pagado") {
      el.addEventListener("click", () => openModal(pair));
    }

    container.appendChild(el);
  });
}

function openModal(pair) {
  selectedPair = pair;
  modalTitle.innerText = `Editar estado`;

  selectedNumbersBox.innerHTML = "";
  pair.numbers.forEach((num) => {
    const chip = document.createElement("div");
    chip.className = "number-chip";
    chip.textContent = num.toString().padStart(3, "0");
    selectedNumbersBox.appendChild(chip);
  });

  statusSelect.value = pair.status;
  pinInput.value = "";
  updateBtn.disabled = true;

  modalError.classList.add("hidden");
  modalSuccess.classList.add("hidden");

  modal.classList.add("active");
}

// Validar PIN
pinInput.addEventListener("input", () => {
  updateBtn.disabled = pinInput.value !== ADMIN_PIN;
});

// Update
updateBtn.addEventListener("click", async () => {
  try {
    modalError.classList.add("hidden");

    const ref = doc(db, "raffles", "rifa2025", "pairs", selectedPair.id);
    const newStatus = statusSelect.value;

    const payload = { status: newStatus };

    if (newStatus === "libre") {
      payload.buyer = "";
      payload.contact = "";
      payload.seller = "";
    }

    await updateDoc(ref, payload);

    modalSuccess.textContent = "Actualizado correctamente";
    modalSuccess.classList.remove("hidden");

    await loadPairs();

    setTimeout(() => modal.classList.remove("active"), 800);
  } catch (err) {
    modalError.textContent = "Error actualizando estado.";
    modalError.classList.remove("hidden");
  }
});

// Cerrar modal al hacer clic fuera
modal.addEventListener("click", (e) => {
  if (e.target === modal) modal.classList.remove("active");
});

// Buscador
const searchInput = document.getElementById("search-input");

searchInput.addEventListener("input", () => {
  const num = searchInput.value.padStart(3, "0");

  clearSearch();
  if (!num.trim()) return;

  const pairs = document.querySelectorAll(".pair");

  for (const el of pairs) {
    if (el.textContent.replace(/ /g, "").includes(num)) {
      el.classList.add("search-highlight");
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      break;
    }
  }
});

function clearSearch() {
  document
    .querySelectorAll(".search-highlight")
    .forEach((el) => el.classList.remove("search-highlight"));
}

loadPairs();
