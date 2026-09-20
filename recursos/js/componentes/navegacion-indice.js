/* ==========================================================================
   COMPONENTE — NAVEGACIÓN ÍNDICE
   Los estados hover/foco se resuelven en CSS (:has). Acá solo se maneja
   la intro: el índice arranca abierto (etiquetas visibles) y se pliega
   a guiones, igual que la variante "Desktop" → "Closed" de Framer.
   ========================================================================== */

import { tienePunteroFino } from "../utilidades/movimiento.js";

const TIEMPO_ABIERTA_EN_INTRO = 2800;

export function iniciarNavegacionIndice(navegacion = document.querySelector("[data-navegacion-indice]")) {
    if (!navegacion) return;

    // En pantallas táctiles el índice queda siempre abierto (lo resuelve el CSS)
    if (!tienePunteroFino()) return;

    navegacion.classList.add("esta-abierta");

    const plegar = () => navegacion.classList.remove("esta-abierta");
    const temporizador = setTimeout(plegar, TIEMPO_ABIERTA_EN_INTRO);

    // Si el usuario interactúa antes, se pliega al salir del índice
    navegacion.addEventListener(
        "pointerleave",
        () => {
            clearTimeout(temporizador);
            plegar();
        },
        { once: true },
    );
}
