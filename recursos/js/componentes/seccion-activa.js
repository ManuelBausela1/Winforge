/* ==========================================================================
   COMPONENTE — SECCIÓN ACTIVA
   Marca en el índice la sección del inicio por la que va pasando el
   visitante. Se resuelve con una línea imaginaria a la altura del 42 % de
   la pantalla: la sección que la cruza es la que se señala.
   ========================================================================== */

import { alScrollear } from "../utilidades/scroll-suave.js";

const ALTURA_REFERENCIA = 0.42;

export function iniciarSeccionActiva(navegacion = document.querySelector("[data-navegacion-indice]")) {
    if (!navegacion) return;

    const referencias = [...navegacion.querySelectorAll("[data-seccion]")]
        .map((enlace) => ({ enlace, seccion: document.getElementById(enlace.dataset.seccion) }))
        .filter(({ seccion }) => seccion);

    if (!referencias.length) return;

    let activo = null;

    function marcar(enlace) {
        if (enlace === activo) return;

        if (activo) {
            activo.classList.remove("esta-activa");
            activo.removeAttribute("aria-current");
        }

        if (enlace) {
            enlace.classList.add("esta-activa");
            enlace.setAttribute("aria-current", "true");
        }

        activo = enlace;
        navegacion.classList.toggle("tiene-seccion", Boolean(enlace));
    }

    function revisar() {
        const linea = window.innerHeight * ALTURA_REFERENCIA;
        let encontrado = null;

        referencias.forEach(({ enlace, seccion }) => {
            const { top, bottom } = seccion.getBoundingClientRect();
            if (top <= linea && bottom > linea) encontrado = enlace;
        });

        marcar(encontrado);
    }

    alScrollear(revisar);
    window.addEventListener("resize", revisar, { passive: true });
    revisar();
}
