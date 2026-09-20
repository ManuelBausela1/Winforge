/* ==========================================================================
   COMPONENTE — PASOS UNIFORMES
   Todas las filas de los pasos miden lo mismo, así los puntos quedan
   siempre a igual distancia aunque una descripción sea más larga.
   Mide la tarjeta más alta y lo publica en la variable CSS --alto-fila.
   ========================================================================== */

const SEPARACION_MINIMA = 32; // px de aire entre una tarjeta y la siguiente

export function iniciarPasosUniformes(lista = document.querySelector("[data-pasos-uniformes]")) {
    if (!lista) return;

    const tarjetas = [...lista.querySelectorAll(".proceso__texto")];
    if (!tarjetas.length) return;

    function medir() {
        // En una sola columna (celular) las filas se acomodan solas
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

    // Con las fuentes ya cargadas la medida es la definitiva
    document.fonts?.ready.then(medir);
    medir();
}
