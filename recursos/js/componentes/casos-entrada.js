/**
 * La entrada de las tarjetas de "Proyectos forjados": cada una llega desde un
 * costado y su foto se descubre detrás de un barrido naranja. Se anima una sola
 * vez, cuando el visitante llega. El resto de la sección no se mueve.
 */

import { prefiereMovimientoReducido } from "../utilidades/movimiento.js";
import { hayAnimacionesDeEntrada } from "../utilidades/animaciones.js";

/* Lo que tarda cada tarjeta en arrancar después de la anterior */
const ESCALON = 260;

/* Lo que dura la entrada completa, contando la demora del texto */
const DURACION_TOTAL = 1400;

const OPCIONES_OBSERVADOR = {
    rootMargin: "0px 0px -12% 0px",
    threshold: 0.15,
};

export function iniciarCasosEntrada(grilla = document.querySelector("[data-casos-grilla]")) {
    if (!grilla) return;

    const casos = [...grilla.querySelectorAll(".caso-exito")];
    if (!casos.length) return;

    /* Sin animaciones de entrada, con movimiento reducido o sin observador,
       las tarjetas se quedan como están: visibles. */
    if (prefiereMovimientoReducido() || !hayAnimacionesDeEntrada() || !("IntersectionObserver" in window)) return;

    for (const caso of casos) caso.classList.add("esta-por-entrar");

    /* El turno de la última que arrancó, para escalonar las que llegan juntas */
    let proximoTurno = 0;

    function entrar(caso) {
        caso.classList.remove("esta-por-entrar");
        caso.classList.add("esta-entrando");

        setTimeout(() => {
            caso.classList.remove("esta-entrando");
            caso.classList.add("esta-adentro");
        }, DURACION_TOTAL);
    }

    const observador = new IntersectionObserver((entradas) => {
        const ahora = performance.now();

        const llegadas = entradas
            .filter((entrada) => entrada.isIntersecting)
            .map((entrada) => entrada.target)
            .sort((una, otra) => casos.indexOf(una) - casos.indexOf(otra));

        for (const caso of llegadas) {
            observador.unobserve(caso);

            const espera = Math.max(0, proximoTurno - ahora);
            proximoTurno = Math.max(ahora, proximoTurno) + ESCALON;

            if (espera === 0) entrar(caso);
            else setTimeout(() => entrar(caso), espera);
        }
    }, OPCIONES_OBSERVADOR);

    for (const caso of casos) observador.observe(caso);
}
