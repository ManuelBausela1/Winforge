/* Las tres formas de acompañamiento: un botón elige, una sola ficha se muestra. */

export function iniciarAcompanamiento() {
    const selector = document.querySelector("[data-acompanamiento]");
    if (!selector) return;

    const opciones = [...selector.querySelectorAll("[role='tab']")];
    if (opciones.length < 2) return;

    function fichaDe(opcion) {
        return document.getElementById(opcion.getAttribute("aria-controls"));
    }

    function elegir(opcion, conFoco = true) {
        for (const otra of opciones) {
            const esLaElegida = otra === opcion;
            const ficha = fichaDe(otra);

            otra.setAttribute("aria-selected", String(esLaElegida));
            otra.tabIndex = esLaElegida ? 0 : -1;

            if (ficha) ficha.hidden = !esLaElegida;
        }

        if (conFoco) opcion.focus();
    }

    for (const opcion of opciones) {
        opcion.addEventListener("click", () => elegir(opcion, false));
    }

    /* Las flechas recorren las opciones, como en cualquier juego de pestañas */
    selector.addEventListener("keydown", (evento) => {
        const paso = { ArrowRight: 1, ArrowLeft: -1, Home: "inicio", End: "fin" }[evento.key];
        if (paso === undefined) return;

        evento.preventDefault();
        const actual = opciones.findIndex((o) => o.getAttribute("aria-selected") === "true");

        let siguiente;
        if (paso === "inicio") siguiente = 0;
        else if (paso === "fin") siguiente = opciones.length - 1;
        else siguiente = (actual + paso + opciones.length) % opciones.length;

        elegir(opciones[siguiente]);
    });
}
