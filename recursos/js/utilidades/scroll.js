import { prefiereMovimientoReducido } from "./movimiento.js";

const URL_LENIS = "https://cdn.jsdelivr.net/npm/lenis@1.3.26/dist/lenis.mjs";

const AJUSTES = {
    lerp: 0.2,
    wheelMultiplier: 1.05,
    smoothWheel: true,
    syncTouch: false,
    anchors: true,
};

export const estadoScroll = {
    posicion: window.scrollY,
    velocidad: 0,
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

    const medirVelocidad = () => {
        estadoScroll.velocidad = estadoScroll.posicion - posicionAnterior;
        posicionAnterior = estadoScroll.posicion;
        requestAnimationFrame(medirVelocidad);
    };

    requestAnimationFrame(medirVelocidad);

    window.addEventListener(
        "scroll",
        () => {
            estadoScroll.posicion = window.scrollY;
            notificar();
        },
        { passive: true },
    );
}

export async function iniciarScroll() {
    if (prefiereMovimientoReducido()) {
        escucharScrollNativo();
        return;
    }

    try {
        const { default: Lenis } = await import(URL_LENIS);
        const lenis = new Lenis({ autoRaf: true, ...AJUSTES });

        lenis.on("scroll", ({ scroll, velocity }) => {
            estadoScroll.posicion = scroll;
            estadoScroll.velocidad = velocity;
            notificar();
        });

        document.documentElement.classList.add("con-scroll-suave");
    } catch (error) {
        console.warn("Scroll suave no disponible, se usa el nativo.", error);
        escucharScrollNativo();
    }
}
