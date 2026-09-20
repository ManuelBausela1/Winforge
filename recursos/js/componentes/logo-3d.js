/* ==========================================================================
   COMPONENTE — LOGO 3D
   El isotipo gira siguiendo al mouse en toda la ventana, con inercia,
   y un brillo recorre su superficie desde el lado donde "está la luz".
   No tiene movimiento propio: solo reacciona al mouse. Cuando el mouse
   sale de la ventana vuelve al centro. En pantallas táctiles queda quieto.
   ========================================================================== */

import {
    interpolar,
    limitar,
    prefiereMovimientoReducido,
    tienePunteroFino,
} from "../utilidades/movimiento.js";

const CONFIGURACION = {
    giroMaximoX: 16, // grados (inclinación vertical)
    giroMaximoY: 24, // grados (inclinación horizontal)
    suavidad: 0.08,
    umbralReposo: 0.0005, // Diferencia mínima para seguir animando
};

export function iniciarLogo3d(contenedor = document.querySelector("[data-logo-3d]")) {
    if (!contenedor || prefiereMovimientoReducido() || !tienePunteroFino()) return;

    const objetivo = { x: 0, y: 0 };
    const actual = { x: 0, y: 0 };

    let estaEnPantalla = true;
    let idFotograma = null;

    function aplicarEstilos() {
        contenedor.style.setProperty("--giro-y", `${(actual.x * CONFIGURACION.giroMaximoY).toFixed(2)}deg`);
        contenedor.style.setProperty("--giro-x", `${(-actual.y * CONFIGURACION.giroMaximoX).toFixed(2)}deg`);
        contenedor.style.setProperty("--brillo-x", `${(50 + actual.x * 45).toFixed(1)}%`);
        contenedor.style.setProperty("--brillo-y", `${(40 + actual.y * 45).toFixed(1)}%`);
    }

    // El ciclo solo corre mientras el logo se está acomodando; en reposo se detiene
    function animar() {
        actual.x = interpolar(actual.x, objetivo.x, CONFIGURACION.suavidad);
        actual.y = interpolar(actual.y, objetivo.y, CONFIGURACION.suavidad);
        aplicarEstilos();

        const enReposo =
            Math.abs(objetivo.x - actual.x) < CONFIGURACION.umbralReposo &&
            Math.abs(objetivo.y - actual.y) < CONFIGURACION.umbralReposo;

        idFotograma = enReposo ? null : requestAnimationFrame(animar);
    }

    function iniciarAnimacion() {
        if (idFotograma === null && estaEnPantalla) {
            idFotograma = requestAnimationFrame(animar);
        }
    }

    function alMoverPuntero(evento) {
        const limites = contenedor.getBoundingClientRect();
        const centroX = limites.left + limites.width / 2;
        const centroY = limites.top + limites.height / 2;

        // Distancia normalizada al centro del logo, tomando la ventana como rango
        objetivo.x = limitar((evento.clientX - centroX) / (window.innerWidth / 2), -1, 1);
        objetivo.y = limitar((evento.clientY - centroY) / (window.innerHeight / 2), -1, 1);
        iniciarAnimacion();
    }

    function volverAlCentro() {
        objetivo.x = 0;
        objetivo.y = 0;
        iniciarAnimacion();
    }

    new IntersectionObserver(([entrada]) => {
        estaEnPantalla = entrada.isIntersecting;
    }).observe(contenedor);

    window.addEventListener("pointermove", alMoverPuntero, { passive: true });
    document.documentElement.addEventListener("mouseleave", volverAlCentro);
}
