import { hayAnimacionesDeEntrada } from "../utilidades/animaciones.js";

const OPCIONES_OBSERVADOR = {
    rootMargin: "0px 0px -15% 0px",
    threshold: 0.1,
};

export function iniciarRevelarAlEntrar(elementos = document.querySelectorAll("[data-revelar]")) {
    if (!elementos.length) return;

    if (!hayAnimacionesDeEntrada() || !("IntersectionObserver" in window)) {
        elementos.forEach((elemento) => elemento.classList.add("esta-visible"));
        return;
    }

    const observador = new IntersectionObserver((entradas) => {
        entradas.forEach((entrada) => {
            if (!entrada.isIntersecting) return;

            entrada.target.classList.add("esta-visible");
            observador.unobserve(entrada.target);
        });
    }, OPCIONES_OBSERVADOR);

    elementos.forEach((elemento) => observador.observe(elemento));
}
