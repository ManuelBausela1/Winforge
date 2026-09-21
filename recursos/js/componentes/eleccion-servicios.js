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

        const slugs = elegidos.map(aSlug);
        guardarEleccion(slugs);

        if (enlace && destino) {
            enlace.setAttribute("href", destino);
            enlace.setAttribute("href", conServiciosEnElEnlace(enlace, slugs));
        }
    }

    selectores.forEach((selector) => {

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
