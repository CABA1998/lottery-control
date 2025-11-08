// script.js
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("numbers-container");

  // Cambia estos valores si quieres otro rango
  const start = 0;
  const end = 999;

  for (let n = start; n <= end; n++) {
    const box = document.createElement("div");
    box.className = "number";
    box.textContent = n;
    box.setAttribute("role", "button");
    box.setAttribute("tabindex", "0");

    // Click y tecla Enter/Espacio para accesibilidad
    box.addEventListener("click", () => box.classList.toggle("vendido"));
    box.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        box.classList.toggle("vendido");
      }
    });

    container.appendChild(box);
  }
});
