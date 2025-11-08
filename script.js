/**
 * Genera los números del 0 al 99 y crea los elementos HTML.
 * Aplica evento de clic para marcar como vendido.
 */
document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("numbers-container");

    for (let n = 0; n < 100; n++) {
        const numberBox = document.createElement("div");
        numberBox.className = "number";
        numberBox.textContent = n;

        numberBox.addEventListener("click", () => {
            numberBox.classList.toggle("vendido");
        });

        container.appendChild(numberBox);
    }
});
