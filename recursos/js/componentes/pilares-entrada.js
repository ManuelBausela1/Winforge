/* El contenido de cada pilar sube desde abajo cuando la ficha entra en pantalla. */

const OPCIONES = {
    rootMargin: "0px 0px -12% 0px",
    threshold: 0.25,
};

export function iniciarPilaresEntrada() {
    const fichas = document.querySelectorAll("[data-pilar-entra]");
    if (!fichas.length) return;

    /* Sin observador, o con menos movimiento, el contenido ya está en su sitio */
    const quietud = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (quietud.matches || !("IntersectionObserver" in window)) {
        fichas.forEach((ficha) => ficha.classList.add("esta-visible"));
        return;
    }

    const observador = new IntersectionObserver((entradas) => {
        for (const entrada of entradas) {
            if (!entrada.isIntersecting) continue;

            entrada.target.classList.add("esta-visible");
            observador.unobserve(entrada.target);
        }
    }, OPCIONES);

    fichas.forEach((ficha) => observador.observe(ficha));
}
