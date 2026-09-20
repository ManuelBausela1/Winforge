/* ==========================================================================
   WINFORGE — CONTACTO
   ========================================================================== */

import { iniciarSitio } from "../recursos/js/principal.js";
import { iniciarFormularioContacto } from "../recursos/js/componentes/formulario-contacto.js";
import { hayAnimacionesDeEntrada } from "../recursos/js/utilidades/animaciones.js";

/* --------------------------------------------------------------------------
   Aparición
   1. El David entra desde la izquierda.
   2. Cuando terminó, el título y el formulario crecen desde un poco más
      chicos hasta su tamaño.
   -------------------------------------------------------------------------- */

const TIEMPOS = {
    antesDeLaFigura: 220, // ms: lo justo para que la entrada se vea
    entradaDeLaFigura: 900, // ms que tarda el David en llegar
};

function esperar(milisegundos) {
    return new Promise((resolver) => setTimeout(resolver, milisegundos));
}

/**
 * Espera dos fotogramas para que el estado inicial se pinte antes de animar.
 * En una pestaña de fondo el navegador congela los fotogramas, así que a los
 * 300 ms se sigue igual: la página nunca queda en blanco esperando.
 */
function esperarPintado() {
    return new Promise((resolver) => {
        const seguir = () => resolver();
        setTimeout(seguir, 300);
        requestAnimationFrame(() => requestAnimationFrame(seguir));
    });
}

async function iniciarAparicion() {
    const seccion = document.querySelector("[data-contacto]");
    if (!seccion) return;

    // Visita repetida: el David y el formulario ya están puestos
    if (!hayAnimacionesDeEntrada()) return;

    const sinAnimacion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pausa = (milisegundos) => esperar(sinAnimacion ? 0 : milisegundos);

    await esperarPintado();

    // 1. El David
    await pausa(TIEMPOS.antesDeLaFigura);
    seccion.classList.add("figura-visible");

    // 2. El título y el formulario
    await pausa(TIEMPOS.entradaDeLaFigura);
    seccion.classList.add("formulario-visible");
}

/* --------------------------------------------------------------------------
   Arranque
   -------------------------------------------------------------------------- */

iniciarSitio();
iniciarAparicion();
iniciarFormularioContacto();
