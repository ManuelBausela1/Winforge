import { tienePunteroFino } from "../utilidades/movimiento.js";

const TIEMPO_ABIERTA_EN_INTRO = 2800;

export function iniciarNavegacionIndice(navegacion = document.querySelector("[data-navegacion-indice]")) {
    if (!navegacion) return;

    if (!tienePunteroFino()) return;

    navegacion.classList.add("esta-abierta");

    const plegar = () => navegacion.classList.remove("esta-abierta");
    const temporizador = setTimeout(plegar, TIEMPO_ABIERTA_EN_INTRO);

    navegacion.addEventListener(
        "pointerleave",
        () => {
            clearTimeout(temporizador);
            plegar();
        },
        { once: true },
    );
}
