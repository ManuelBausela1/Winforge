/* ==========================================================================
   WINFORGE — QUIÉNES SOMOS
   ========================================================================== */

import { iniciarSitio } from "../recursos/js/principal.js";
import { hayAnimacionesDeEntrada } from "../recursos/js/utilidades/animaciones.js";

/* --------------------------------------------------------------------------
   Presentación
   El título y la frase ya están desde que carga la página. Lo único que
   aparece es el gráfico de los tres aspectos, que entra desde la derecha.
   -------------------------------------------------------------------------- */

const ANTES_DEL_GRAFICO = 220; // ms: lo justo para que la entrada se vea

function iniciarPresentacion() {
    const presentacion = document.querySelector("[data-presentacion]");
    if (!presentacion) return;

    // Visita repetida: el gráfico ya está en su lugar
    if (!hayAnimacionesDeEntrada()) return;

    // Dos fotogramas: garantizan que el estado inicial se pinte antes de animar.
    // En una pestaña de fondo los fotogramas se congelan, así que el tiempo
    // corre igual: el gráfico nunca queda invisible esperando.
    const mostrar = () => presentacion.classList.add("grafico-visible");

    setTimeout(mostrar, ANTES_DEL_GRAFICO + 300);
    requestAnimationFrame(() => {
        requestAnimationFrame(() => setTimeout(mostrar, ANTES_DEL_GRAFICO));
    });
}

/* --------------------------------------------------------------------------
   Arranque
   -------------------------------------------------------------------------- */

iniciarSitio();
iniciarPresentacion();
