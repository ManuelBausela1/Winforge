const SEPARACION_MINIMA = 32;

export function iniciarPasosUniformes(lista = document.querySelector("[data-pasos-uniformes]")) {
    if (!lista) return;

    const tarjetas = [...lista.querySelectorAll(".proceso__texto")];
    if (!tarjetas.length) return;

    function medir() {

        if (getComputedStyle(lista).gridAutoRows === "auto") {
            lista.style.removeProperty("--alto-fila");
            return;
        }

        lista.style.setProperty("--alto-fila", "auto");

        const masAlta = tarjetas.reduce(
            (maximo, tarjeta) => Math.max(maximo, tarjeta.getBoundingClientRect().height),
            0,
        );

        lista.style.setProperty("--alto-fila", `${Math.ceil(masAlta) + SEPARACION_MINIMA}px`);
    }

    let temporizador;
    new ResizeObserver(() => {
        clearTimeout(temporizador);
        temporizador = setTimeout(medir, 120);
    }).observe(lista);

    document.fonts?.ready.then(medir);
    medir();
}
