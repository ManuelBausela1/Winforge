import { iniciarSitio } from "../recursos/js/principal.js";
import { iniciarFormularioContacto } from "../recursos/js/componentes/formulario-contacto.js";
import { hayAnimacionesDeEntrada } from "../recursos/js/utilidades/animaciones.js";

const TIEMPOS = {
    antesDeLaFigura: 220,
    entradaDeLaFigura: 900,
};

function esperar(milisegundos) {
    return new Promise((resolver) => setTimeout(resolver, milisegundos));
}

function esperarPintado() {
    return new Promise((resolver) => {
        const seguir = () => resolver();
        setTimeout(seguir, 300);
        requestAnimationFrame(() => requestAnimationFrame(seguir));
    });
}

async function iniciarAparicion() {
    const seccion = document.querySelector("[data-contacto]");
    if (!seccion) return;

    if (!hayAnimacionesDeEntrada()) return;

    const sinAnimacion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pausa = (milisegundos) => esperar(sinAnimacion ? 0 : milisegundos);

    await esperarPintado();

    await pausa(TIEMPOS.antesDeLaFigura);
    seccion.classList.add("figura-visible");

    await pausa(TIEMPOS.entradaDeLaFigura);
    seccion.classList.add("formulario-visible");
}

iniciarSitio();
iniciarAparicion();
iniciarFormularioContacto();
