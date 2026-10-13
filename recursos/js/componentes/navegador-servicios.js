/**
 * Ventana de navegador: cada servicio enciende su escena ilustrativa y su
 * descripción. El primero —el sitio web— suma la vista de escritorio y móvil.
 */
export function iniciarNavegadorServicios(raiz = document.querySelector("[data-navegador-servicios]")) {
    if (!raiz) return;

    const opciones = [...raiz.querySelectorAll("[data-opcion]")];
    const vistas = [...raiz.querySelectorAll("[data-vista]")];
    const detalles = [...raiz.querySelectorAll("[data-detalle]")];
    const dispositivos = raiz.querySelector("[data-dispositivos]");
    const botonesDispositivo = [...raiz.querySelectorAll("[data-dispositivo]")];

    if (!opciones.length) return;

    const compacta = window.matchMedia("(max-width: 1100px)");
    const panel = raiz.querySelector(".digital__panel");
    const desplegables = detalles.map((detalle, indice) => {
        const nombre = opciones[indice]?.querySelector(".digital-opcion__nombre")?.textContent;
        const contenido = document.createElement("div");
        contenido.className = "digital-detalle__contenido";
        contenido.id = `${panel.id}-contenido-${indice}`;
        contenido.append(...detalle.childNodes);

        const titulo = document.createElement("h3");
        titulo.className = "digital-detalle__titulo";
        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "digital-desplegable";
        boton.id = `${panel.id}-boton-${indice}`;
        boton.setAttribute("aria-controls", contenido.id);
        boton.setAttribute("aria-expanded", "false");
        boton.textContent = nombre;
        contenido.setAttribute("role", "region");
        contenido.setAttribute("aria-label", nombre);
        opciones[indice]?.setAttribute("aria-controls", contenido.id);
        titulo.append(boton);
        detalle.append(titulo, contenido);
        return { boton, contenido };
    });

    let elegido = 0;
    let abierto = null;
    let enMovil = false;

    function pintar({ animar = false } = {}) {
        if (panel) panel.setAttribute("aria-live", compacta.matches ? "off" : "polite");
        opciones.forEach((opcion, indice) => opcion.setAttribute("aria-pressed", String(indice === elegido)));
        vistas.forEach((vista, indice) => vista.classList.toggle("esta-activa", indice === elegido));

        detalles.forEach((detalle, indice) => {
            /* En escritorio se reserva el alto; en móvil cada botón abre su contenido. */
            detalle.hidden = false;
            detalle.classList.toggle("esta-oculto", !compacta.matches && indice !== elegido);
            detalle.inert = !compacta.matches && indice !== elegido;
            const expandido = compactoAbierto(indice);
            desplegables[indice].contenido.hidden = compacta.matches && !expandido;
            desplegables[indice].boton.setAttribute("aria-expanded", String(expandido));
            detalle.classList.toggle("esta-abierto", expandido);

            if (animar && indice === elegido) {
                detalle.classList.remove("esta-cambiando");
                void detalle.offsetWidth;
                detalle.classList.add("esta-cambiando");
            }
        });

        /* La vista de dispositivo solo tiene sentido para el sitio web. */
        if (dispositivos) dispositivos.hidden = elegido !== 0;
        raiz.dataset.movil = String(elegido === 0 && enMovil);

        botonesDispositivo.forEach((boton, indice) => {
            boton.setAttribute("aria-pressed", String(indice === (enMovil ? 1 : 0)));
        });
    }

    function compactoAbierto(indice) {
        return compacta.matches && abierto === indice;
    }

    desplegables.forEach(({ boton }, indice) => {
        boton.addEventListener("click", () => {
            abierto = abierto === indice ? null : indice;
            elegido = indice;
            pintar();

            /* Al cerrar la tarjeta anterior, mantenemos visible el botón que se tocó. */
            const arriba = boton.getBoundingClientRect().top;
            if (arriba < 92) window.scrollBy({ top: arriba - 92, behavior: "instant" });
        });
    });

    opciones.forEach((opcion, indice) => {
        opcion.addEventListener("click", () => {
            if (elegido === indice) return;

            elegido = indice;
            pintar({ animar: true });
        });
    });

    botonesDispositivo.forEach((boton, indice) => {
        boton.addEventListener("click", () => {
            enMovil = indice === 1;
            pintar();
        });
    });

    raiz.querySelector("[data-selector]")?.addEventListener("keydown", (evento) => {
        if (evento.altKey || evento.ctrlKey || evento.metaKey) return;

        let destino;

        if (evento.key === "ArrowRight") destino = (elegido + 1) % opciones.length;
        if (evento.key === "ArrowLeft") destino = (elegido - 1 + opciones.length) % opciones.length;
        if (evento.key === "Home") destino = 0;
        if (evento.key === "End") destino = opciones.length - 1;

        if (destino === undefined) return;

        evento.preventDefault();
        elegido = destino;
        opciones[destino].focus();
        pintar({ animar: true });
    });

    compacta.addEventListener("change", () => pintar());
    pintar();
}
