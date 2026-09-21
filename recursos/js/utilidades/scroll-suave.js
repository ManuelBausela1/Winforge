import { prefiereMovimientoReducido } from "./movimiento.js";

const URL_LENIS = "https://cdn.jsdelivr.net/npm/lenis@1.3.26/dist/lenis.mjs";

export const estadoScroll = {
    posicion: window.scrollY,
    velocidad: 0,
    instancia: null,
};

const suscriptores = new Set();

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
            lerp: 0.085,
            wheelMultiplier: 0.9,
            anchors: true,
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
