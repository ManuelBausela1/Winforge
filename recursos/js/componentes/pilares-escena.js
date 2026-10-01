import { alScrollear } from "../utilidades/scroll.js";
import { prefiereMovimientoReducido } from "../utilidades/movimiento.js";

const ANCHO_MINIMO = 1101;
const TRAMO_UTIL = 1;

export function iniciarPilaresEscena(seccion = document.querySelector("[data-presentacion]")) {
    if (!seccion) return;

    const lista = seccion.querySelector("[data-pilares]");
    if (!lista || prefiereMovimientoReducido()) return;

    const pilares = [...lista.querySelectorAll("[data-pilar]")];
    if (!pilares.length) return;

    const pantallaAncha = window.matchMedia(`(min-width: ${ANCHO_MINIMO}px)`);
    let encendida = false;
    let alturaLibre = 1;

    function apagar() {
        encendida = false;
        seccion.classList.remove("presentacion--escena");
        seccion.style.removeProperty("--avance");
        pilares.forEach((pilar) => {
            pilar.style.removeProperty("--desde-x");
            pilar.style.removeProperty("--desde-y");
        });
    }

    function medir() {
        if (!pantallaAncha.matches) {
            apagar();
            return;
        }

        seccion.classList.add("presentacion--escena", "presentacion--midiendo");
        const final = pilares.map((pilar) => pilar.getBoundingClientRect());

        seccion.classList.add("presentacion--fila");
        const fila = pilares.map((pilar) => pilar.getBoundingClientRect());

        seccion.classList.remove("presentacion--fila", "presentacion--midiendo");

        pilares.forEach((pilar, indice) => {
            const centroFila = fila[indice].left + fila[indice].width / 2;
            const centroFinal = final[indice].left + final[indice].width / 2;

            pilar.style.setProperty("--desde-x", `${(centroFila - centroFinal).toFixed(1)}px`);
            pilar.style.setProperty("--desde-y", `${(fila[indice].top - final[indice].top).toFixed(1)}px`);
        });

        encendida = true;
        alturaLibre = Math.max(1, seccion.offsetHeight - window.innerHeight);
        ubicar();
    }

    function ubicar() {
        if (!encendida) return;

        const { top } = seccion.getBoundingClientRect();
        const recorrido = Math.min(1, Math.max(0, -top / alturaLibre));

        seccion.style.setProperty("--avance", Math.min(1, recorrido / TRAMO_UTIL).toFixed(4));
    }

    alScrollear(ubicar);
    window.addEventListener("resize", medir, { passive: true });
    pantallaAncha.addEventListener("change", medir);

    if (document.fonts?.ready) document.fonts.ready.then(medir);
    medir();
}
