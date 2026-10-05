import { alScrollear } from "../utilidades/scroll.js";

/**
 * En las páginas claras hay tramos de fondo oscuro. Mientras la navegación o
 * el logo quedan sobre uno, se encienden en claro para no desaparecer.
 */
export function iniciarTramoOscuro() {
    const tramos = [...document.querySelectorAll("[data-tramo-oscuro]")];
    if (!tramos.length) return;

    const piezas = [
        document.querySelector("[data-navegacion-indice]"),
        document.querySelector(".cabecera__logo"),
    ].filter(Boolean);

    if (!piezas.length) return;

    function revisar() {
        for (const pieza of piezas) {
            const caja = pieza.getBoundingClientRect();
            const centro = caja.top + caja.height / 2;

            const encima = tramos.some((tramo) => {
                const { top, bottom } = tramo.getBoundingClientRect();
                return top <= centro && bottom >= centro;
            });

            pieza.classList.toggle("esta-sobre-oscuro", encima);
        }
    }

    alScrollear(revisar);
    window.addEventListener("resize", revisar, { passive: true });
    revisar();
}
