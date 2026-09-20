/* ==========================================================================
   UTILIDADES — TEMA DEL FONDO
   Las secciones marcadas con data-tema-fondo="claro" vuelven el fondo
   blanco. Calcula cuánto "tema claro" corresponde según la posición de
   esas secciones en la ventana (0 a 1, con transición gradual) y marca
   el <body> con .tema-claro para que la interfaz fija cambie de color.
   ========================================================================== */

import { limitar } from "./movimiento.js";

// Franja de la ventana donde ocurre la transición (en proporción del alto)
const INICIO_TRANSICION = 0.6;
const FIN_TRANSICION = 0.2;

function progresoEntrada(bordeEnPx, altoVentana) {
    const posicion = bordeEnPx / altoVentana;
    const progreso = limitar((INICIO_TRANSICION - posicion) / (INICIO_TRANSICION - FIN_TRANSICION), 0, 1);

    return progreso * progreso * (3 - 2 * progreso); // smoothstep
}

export function crearTemaFondo() {
    const seccionesClaras = [...document.querySelectorAll('[data-tema-fondo="claro"]')];
    let temaClaroActivo = false;

    /** Devuelve el valor objetivo del tema claro (0 a 1) para este fotograma. */
    function calcular() {
        if (!seccionesClaras.length) return 0;

        const altoVentana = window.innerHeight;
        let valor = 0;

        for (const seccion of seccionesClaras) {
            const { top, bottom } = seccion.getBoundingClientRect();
            const entrada = progresoEntrada(top, altoVentana);
            const salida = progresoEntrada(bottom, altoVentana);

            valor = Math.max(valor, entrada - salida);
        }

        return valor;
    }

    /** Sincroniza la clase del body con histéresis para evitar parpadeos. */
    function sincronizarInterfaz(valor) {
        if (!temaClaroActivo && valor > 0.55) {
            temaClaroActivo = true;
            document.body.classList.add("tema-claro");
        } else if (temaClaroActivo && valor < 0.45) {
            temaClaroActivo = false;
            document.body.classList.remove("tema-claro");
        }
    }

    return { calcular, sincronizarInterfaz };
}
