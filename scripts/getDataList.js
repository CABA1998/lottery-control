// Importar Firebase SDK modular
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import { firebaseConfig } from "./firebaseConfig.js";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Referencias del DOM
const container = document.getElementById("numbers-container");
const modal = document.getElementById("modal-backdrop");

const confirmBtn = document.getElementById("confirm-btn");
const nameInput = document.getElementById("name-input");
const phoneInput = document.getElementById("phone-input");
const modalError = document.getElementById("modal-error");
const modalInfoMsg = document.getElementById("modal-info");
const modalSuccessMsg = document.getElementById("modal-success");
const modalForm = document.getElementById("modal-form");
const modalTitle = document.getElementById("modal-title");
const selectedNumbersBox = document.getElementById("selected-numbers");

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
      el.style.touchAction = "manipulation";
      el.addEventListener("click", () => openModal(pair));
      el.addEventListener("touchstart", () => openModal(pair), {
        passive: true,
      });
    }

    container.appendChild(el);
  });
}

// Abrir modal
// RESETEAR TODO AL ABRIR
function openModal(pair) {
  selectedPair = pair;
  modalTitle.innerText = "Comprar Boleta";

  // chips de las opciones
  // Crear chips de números seleccionados
  selectedNumbersBox.innerHTML = "";

  pair.numbers.forEach((num) => {
    const chip = document.createElement("div");
    chip.className = "number-chip";
    chip.textContent = num.toString().padStart(3, "0");
    selectedNumbersBox.appendChild(chip);
  });

  // Chip de costo
  const priceChip = document.createElement("div");
  priceChip.className = "cost-chip";
  priceChip.textContent = "$10.000";

  selectedNumbersBox.appendChild(priceChip);

  modalInfoMsg.textContent =
    "Ingresa tus datos para registrar la compra. Te redireccionaremos a WhatsApp para que envíes el comprobante de pago.";
  modalInfoMsg.classList.remove("hidden");

  modalError.classList.add("hidden");
  modalError.textContent = "";

  modalSuccessMsg.classList.add("hidden");
  modalSuccessMsg.textContent = "";

  modalForm.style.display = "block";
  confirmBtn.disabled = true;
  confirmBtn.innerHTML = "Enviar";

  nameInput.value = "";
  phoneInput.value = "";

  modal.classList.add("active");
}

// VALIDACIONES EN TIEMPO REAL
function validateForm() {
  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();

  const isNameValid = name.length >= 3 && !/\d/.test(name); // sin números

  const isPhoneValid = /^\d{10}$/.test(phone); // 10 dígitos numéricos

  if (isNameValid && isPhoneValid) {
    confirmBtn.disabled = false;
  } else {
    confirmBtn.disabled = true;
  }
}

nameInput.addEventListener("input", validateForm);
phoneInput.addEventListener("input", validateForm);

// BOTÓN CONFIRMAR
confirmBtn.addEventListener("click", async () => {
  if (confirmBtn.innerText === "Cerrar") {
    modal.classList.remove("active");
    return; // ⛔ DETIENE TODO EL FLUJO
  }
  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();

  // LIMPIAR MENSAJES
  modalError.classList.add("hidden");
  modalSuccessMsg.classList.add("hidden");

  // OCULTAR FORMULARIO
  modalForm.style.display = "none";

  // MOSTRAR INFO DE PROCESO
  modalInfoMsg.textContent = "Registrando tu compra, por favor espera…";
  modalInfoMsg.classList.remove("hidden");

  // SPINNER BOTÓN
  confirmBtn.innerHTML = `<span class="spinner-btn"></span>Procesando…`;
  confirmBtn.classList.add("btn-loading");
  confirmBtn.disabled = true;

  try {
    // ACTUALIZAR FIRESTORE
    await markAsReserved(selectedPair, name, phone);
    // MOSTRAR ÉXITO
    modalInfoMsg.classList.add("hidden");
    modalSuccessMsg.textContent =
      "¡Mil gracias por tu apoyo a la cultura! 💚 Mucha suerte 💚 ¡Te esperamos este 28 de diciembre en Hatoviejo!";
    modalSuccessMsg.classList.remove("hidden");
    modalTitle.innerText = "Compra exitosa";

    // RETRASO DE 1 SEG PARA VER MENSAJE
    await new Promise((res) => setTimeout(res, 1000));
    // RECARGAR TABLERO
    await loadPairs();

    // ABRIR WHATSAPP
    const message = encodeURIComponent(
      `Hola, quiero participar en la rifa con los siguientes números:\n` +
        `Números: ${selectedPair.numbers
          .map((n) => n.toString().padStart(3, "0"))
          .join(" - ")}\n` +
        `Nombre: ${name}\nTeléfono: ${phone}`
    );

    // window.open(`https://wa.me/${sellerPhone}?text=${message}`, "_blank");
    const whatsappURL = `https://wa.me/${sellerPhone}?text=${message}`;
    // Detectar si es un dispositivo iOS (Safari móvil)
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isIOS) {
      // Safari móvil bloquea window.open después de await → usar redirect
      window.location.href = whatsappURL;
    } else {
      // En escritorio, Android y navegadores modernos → nueva pestaña
      window.open(whatsappURL, "_blank");
    }

    // BOTÓN PARA CERRAR
    confirmBtn.innerHTML = "Cerrar";
    confirmBtn.classList.remove("btn-loading");
    confirmBtn.disabled = false;
  } catch (err) {
    console.error("Error al reservar:", err);

    modalInfoMsg.classList.add("hidden");

    modalError.textContent =
      "Hubo un error registrando la reserva. Intenta nuevamente.";
    modalError.classList.remove("hidden");
    modalTitle.innerText = "Ocurrió un problema";

    modalForm.style.display = "block";

    confirmBtn.innerHTML = "Enviar";
    confirmBtn.disabled = true;
  }
});

// Cerrar modal al hacer clic fuera
modal.addEventListener("click", (e) => {
  if (e.target === modal) modal.classList.remove("active");
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
      setTimeout(() => scrollToElement(pairEl), 50);
      break;
    }
  }
}

function scrollToElement(el) {
  const y = el.getBoundingClientRect().top + window.scrollY - 250;
  window.scrollTo({ top: y, behavior: "smooth" });
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
async function markAsReserved(pair, name, phone) {
  try {
    const ref = doc(db, "raffles", "rifa2025", "pairs", pair.id);
    await updateDoc(ref, {
      status: "apartado",
      buyer: name,
      contact: phone,
      seller: sellerParam,
      note: "Hola",
    });
    console.log(`✔ Pareja ${pair.pair_id} marcada como apartado`);
  } catch (err) {
    console.error("❌ Error al actualizar estado:", err);
  }
}

loadPairs();
