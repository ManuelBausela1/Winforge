/* ==========================================================================
   COMPONENTE — REVELAR AL ENTRAR
   Agrega la clase .esta-visible a los elementos con [data-revelar] la
   primera vez que entran en pantalla. En una visita repetida (sin la clase
   "animar") se marcan todos de entrada, sin esperar al scroll. La animación la define el CSS de
   cada sección, así este módulo sirve para todo el sitio.
   ========================================================================== */

import { hayAnimacionesDeEntrada } from "../utilidades/animaciones.js";

const OPCIONES_OBSERVADOR = {
    rootMargin: "0px 0px -15% 0px", // Se revela un poco antes de llegar al centro
    threshold: 0.1,
};

export function iniciarRevelarAlEntrar(elementos = document.querySelectorAll("[data-revelar]")) {
    if (!elementos.length) return;

    // Visita repetida o navegador sin soporte: se muestra todo directamente
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
