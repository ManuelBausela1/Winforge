/* Amplía una captura en un diálogo: se cierra con el botón, Escape o un clic afuera. */

export function iniciarVisorImagenes(visor = document.querySelector("[data-visor]")) {
    if (!visor || typeof visor.showModal !== "function") return;

    const imagen = visor.querySelector("[data-imagen-visor]");
    const titulo = visor.querySelector(".visor__titulo");
    const cerrar = visor.querySelector("[data-cerrar-visor]");
    const disparadores = [...document.querySelectorAll("[data-ampliar]")];
    if (!disparadores.length) return;

    let quienAbrio = null;

    for (const boton of disparadores) {
        boton.addEventListener("click", () => {
            quienAbrio = boton;
            imagen.src = boton.dataset.ampliar;
            imagen.alt = boton.dataset.rotulo ?? "";
            titulo.textContent = boton.dataset.rotulo ?? "Vista ampliada";

            visor.showModal();
            cerrar.focus();
        });
    }

    cerrar.addEventListener("click", () => visor.close());

    /* Un clic fuera del recuadro también cierra */
    visor.addEventListener("click", (evento) => {
        if (evento.target !== visor) return;

        const caja = visor.getBoundingClientRect();
        const afuera =
            evento.clientX < caja.left ||
            evento.clientX > caja.right ||
            evento.clientY < caja.top ||
            evento.clientY > caja.bottom;

        if (afuera) visor.close();
    });

    /* Al cerrar, el foco vuelve a donde estaba: el salto va después del cierre */
    visor.addEventListener("close", () => {
        setTimeout(() => quienAbrio?.focus(), 0);
    });
}
