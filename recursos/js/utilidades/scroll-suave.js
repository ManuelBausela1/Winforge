/* ==========================================================================
   UTILIDADES — SCROLL SUAVE
   Scroll con inercia (Lenis) y un estado compartido con la posición y la
   velocidad, para que el fondo y futuras animaciones reaccionen al scroll.
   Si Lenis no carga o el usuario prefiere menos movimiento, se usa el
   scroll nativo y el estado se sigue actualizando igual.
   ========================================================================== */

import { prefiereMovimientoReducido } from "./movimiento.js";

const URL_LENIS = "https://cdn.jsdelivr.net/npm/lenis@1.3.26/dist/lenis.mjs";

/** Estado de solo lectura para el resto de los módulos. */
export const estadoScroll = {
    posicion: window.scrollY,
    velocidad: 0, // px por fotograma, con signo (+ hacia abajo)
    instancia: null,
};

const suscriptores = new Set();

/**
 * Ejecuta la función en el mismo instante en que se mueve la página.
 * Útil para lo que tiene que ir "pegado" al contenido sin retraso.
 */
export function alScrollear(funcion) {
    suscriptores.add(funcion);
    return () => suscriptores.delete(funcion);
}

function notificar() {
    suscriptores.forEach((funcion) => funcion(estadoScroll));
}

function escucharScrollNativo() {
    let posicionAnterior = window.scrollY;

    const actualizar = () => {
        estadoScroll.posicion = window.scrollY;
        estadoScroll.velocidad = estadoScroll.posicion - posicionAnterior;
        posicionAnterior = estadoScroll.posicion;
        requestAnimationFrame(actualizar);
    };

    requestAnimationFrame(actualizar);
    window.addEventListener(
        "scroll",
        () => {
            estadoScroll.posicion = window.scrollY;
            notificar();
        },
        { passive: true },
    );
}

export async function iniciarScrollSuave() {
    if (prefiereMovimientoReducido()) {
        escucharScrollNativo();
        return;
    }

    try {
        const { default: Lenis } = await import(URL_LENIS);

        const lenis = new Lenis({
            autoRaf: true,
            lerp: 0.085, // Más bajo = más inercia
            wheelMultiplier: 0.9,
            anchors: true, // Los enlaces #ancla también se desplazan suave
        });

        lenis.on("scroll", ({ scroll, velocity }) => {
            estadoScroll.posicion = scroll;
            estadoScroll.velocidad = velocity;
            notificar();
        });

        estadoScroll.instancia = lenis;
    } catch (error) {
        console.warn("Scroll suave no disponible, se usa el nativo.", error);
        escucharScrollNativo();
    }
}
