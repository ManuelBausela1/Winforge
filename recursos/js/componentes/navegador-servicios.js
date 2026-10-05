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

    let elegido = 0;
    let enMovil = false;

    function pintar({ animar = false } = {}) {
        opciones.forEach((opcion, indice) => opcion.setAttribute("aria-pressed", String(indice === elegido)));
        vistas.forEach((vista, indice) => vista.classList.toggle("esta-activa", indice === elegido));

        detalles.forEach((detalle, indice) => {
            detalle.hidden = indice !== elegido;

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

    pintar();
}
