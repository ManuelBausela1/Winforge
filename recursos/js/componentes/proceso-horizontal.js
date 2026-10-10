import { alScrollear } from "../utilidades/scroll.js";
import { prefiereMovimientoReducido } from "../utilidades/movimiento.js";

const PUNTO_DE_ENCENDIDO = 0.62;

/* Lo que pasa por el centro se ve nítido; a esta distancia ya está borroso. */
const ALCANCE_DEL_FOCO = 0.72;

/* El riel termina su recorrido antes de que la sección se suelte: el resto
   del scroll queda como pausa, con el timeline completo en pantalla. */
const TRAMO_UTIL = 0.82;

export function iniciarProcesoHorizontal(seccion = document.querySelector("[data-proceso]")) {
    if (!seccion) return;

    const riel = seccion.querySelector("[data-riel]");
    const ventana = seccion.querySelector(".proceso__ventana");
    const linea = seccion.querySelector(".proceso__linea");
    const pasos = [...seccion.querySelectorAll("[data-paso]")];
    if (!riel || !pasos.length) return;

    const pantallaCompacta = window.matchMedia("(max-width: 1100px)");
    const consultaMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)");
    const museo = seccion.querySelector(".proceso__museo");
    const obras = [...seccion.querySelectorAll(".proceso__obra")];

    /* Las mismas obras acompañan los pasos 1, 3 y 5 en vertical. Al volver
       a escritorio recuperan su lugar en el fondo, sin duplicar imágenes. */
    function acomodarObras() {
        if (!museo) return;
        obras.forEach((obra, indice) => {
            const destino = pantallaCompacta.matches ? pasos[Math.min(indice * 2, pasos.length - 1)] : museo;
            if (obra.parentElement !== destino) destino.append(obra);
        });
    }

    let recorrido = 0;
    let alturaLibre = 0;
    let encendidos = 0;

    function medir() {
        acomodarObras();
        const sinMovimiento = prefiereMovimientoReducido();
        seccion.classList.toggle("proceso--sin-desplazamiento", sinMovimiento);
        if (pantallaCompacta.matches || sinMovimiento) {
            seccion.style.removeProperty("--recorrido");
            seccion.style.removeProperty("--avance");
            pasos.forEach((paso) => {
                paso.classList.add("esta-activo");
                paso.style.setProperty("--foco", "1");
            });
            return;
        }

        recorrido = Math.max(0, riel.scrollWidth - (ventana?.clientWidth || window.innerWidth));
        alturaLibre = Math.max(1, seccion.offsetHeight - window.innerHeight);
        seccion.style.setProperty("--recorrido", `${recorrido}px`);
        ubicar();
    }

    function ubicar() {
        if (pantallaCompacta.matches || prefiereMovimientoReducido()) return;

        const { top } = seccion.getBoundingClientRect();
        const recorridoDelScroll = Math.min(1, Math.max(0, -top / alturaLibre));
        const avance = Math.min(1, recorridoDelScroll / TRAMO_UTIL);

        seccion.style.setProperty("--avance", avance.toFixed(4));

        const centro = window.innerWidth * PUNTO_DE_ENCENDIDO;
        const medioDeLaPantalla = window.innerWidth / 2;
        const alcance = window.innerWidth * ALCANCE_DEL_FOCO;

        pasos.forEach((paso, indice) => {
            // El rectángulo ya viene con el desplazamiento del riel aplicado:
            // es la posición real del punto en la pantalla.
            const caja = paso.getBoundingClientRect();

            // Cuánto le falta a esta tarjeta para estar en el medio
            const distancia = Math.abs(caja.left + caja.width / 2 - medioDeLaPantalla);
            const foco = Math.max(0, 1 - distancia / alcance);
            paso.style.setProperty("--foco", foco.toFixed(3));

            if (caja.left > centro) return;

            // Una vez encendido se queda: al volver hacia arriba el timeline
            // ya está hecho y no se repite toda la animación.
            paso.classList.add("esta-activo");
            encendidos = Math.max(encendidos, indice + 1);
        });

        if (linea) {
            linea.style.setProperty("--avance-linea", (encendidos / pasos.length).toFixed(3));
        }
    }

    alScrollear(ubicar);
    window.addEventListener("resize", medir, { passive: true });
    pantallaCompacta.addEventListener("change", medir);
    consultaMovimiento.addEventListener("change", medir);

    if (document.fonts?.ready) document.fonts.ready.then(medir);
    medir();
}
