/**
 * Acordeón de los puntos del servicio: siempre queda uno abierto y el resto
 * muestra solo su nombre.
 */
export function iniciarAcordeonPuntos(acordeon = document.querySelector("[data-acordeon-puntos]")) {
    if (!acordeon) return;

    const paneles = [...acordeon.querySelectorAll("[data-panel]")];
    if (!paneles.length) return;

    function abrir(elegido) {
        paneles.forEach((panel) => {
            const esElegido = panel === elegido;
            const boton = panel.querySelector("[data-disparador]");
            const cuerpo = panel.querySelector(".panel__cuerpo");

            panel.classList.toggle("esta-abierto", esElegido);
            boton?.setAttribute("aria-expanded", String(esElegido));
            if (cuerpo) cuerpo.inert = !esElegido;
        });
    }

    paneles.forEach((panel) => {
        const boton = panel.querySelector("[data-disparador]");
        if (!boton) return;

        boton.addEventListener("click", () => abrir(panel));

        boton.addEventListener("keydown", (evento) => {
            if (evento.altKey || evento.ctrlKey || evento.metaKey) return;

            const indice = paneles.indexOf(panel);
            let destino;

            if (evento.key === "ArrowRight") destino = (indice + 1) % paneles.length;
            if (evento.key === "ArrowLeft") destino = (indice - 1 + paneles.length) % paneles.length;
            if (evento.key === "Home") destino = 0;
            if (evento.key === "End") destino = paneles.length - 1;

            if (destino === undefined) return;

            evento.preventDefault();
            abrir(paneles[destino]);
            paneles[destino].querySelector("[data-disparador]")?.focus();
        });
    });

    abrir(paneles.find((panel) => panel.classList.contains("esta-abierto")) ?? paneles[0]);
}
