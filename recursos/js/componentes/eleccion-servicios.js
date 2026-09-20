/* ==========================================================================
   COMPONENTE — ELECCIÓN DE SERVICIOS
   El visitante puede marcar uno o varios servicios. Debajo de las tarjetas
   aparecen los elegidos, separados por un punto, y el botón para empezar.
   Sin nada elegido, ese bloque no se muestra.
   La elección viaja a contacto: se guarda y se suma al enlace (?servicios=).
   ========================================================================== */

import { aSlug, guardarEleccion, conServiciosEnElEnlace } from "../utilidades/servicios.js";

const SEPARADOR = " · ";

export function iniciarEleccionServicios(seccion = document.querySelector("[data-servicios]")) {
    if (!seccion) return;

    const selectores = [...seccion.querySelectorAll("[data-servicio]")];
    const bloque = seccion.querySelector("[data-eleccion-servicios]");
    const listaElegidos = seccion.querySelector("[data-servicios-elegidos]");
    if (!selectores.length || !bloque || !listaElegidos) return;

    const enlace = bloque.querySelector("a[href]");
    const destino = enlace?.getAttribute("href");

    function actualizar() {
        const elegidos = selectores
            .filter((selector) => selector.getAttribute("aria-pressed") === "true")
            .map((selector) => selector.dataset.servicio);

        listaElegidos.textContent = elegidos.join(SEPARADOR);
        bloque.hidden = elegidos.length === 0;
        bloque.classList.toggle("esta-visible", elegidos.length > 0);

        // La elección se lleva a contacto por la URL y también guardada
        const slugs = elegidos.map(aSlug);
        guardarEleccion(slugs);

        if (enlace && destino) {
            enlace.setAttribute("href", destino);
            enlace.setAttribute("href", conServiciosEnElEnlace(enlace, slugs));
        }
    }

    selectores.forEach((selector) => {
        // Con el mouse se suelta el foco: así la carpeta no queda abierta
        // después del clic. Con el teclado el foco se conserva.
        let conPuntero = false;
        selector.addEventListener("pointerdown", () => {
            conPuntero = true;
        });

        selector.addEventListener("click", () => {
            const elegido = selector.getAttribute("aria-pressed") === "true";

            selector.setAttribute("aria-pressed", String(!elegido));
            selector.closest(".tarjeta-servicio")?.classList.toggle("esta-elegida", !elegido);
            actualizar();

            if (conPuntero) {
                selector.blur();
                conPuntero = false;
            }
        });
    });

    actualizar();
}
