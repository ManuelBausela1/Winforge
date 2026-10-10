/**
 * La sección de acompañamiento. Tres cosas conviven acá:
 *  - la entrada: el megáfono llama, bajan las dos tarjetas y se abre Rayuela;
 *  - en cada vía pasa un logo de cliente por vez;
 *  - la demostración de Rayuela escribe sola una consulta de familia.
 * Los logos y el chat se detienen mientras la sección no está a la vista o la
 * pestaña está oculta. La entrada corre una sola vez.
 */

import { prefiereMovimientoReducido } from "../utilidades/movimiento.js";
import { hayAnimacionesDeEntrada } from "../utilidades/animaciones.js";

const PASO_DE_LOGO = 3200;
const ESPERA_ENTRE_CINTAS = 600;

/* Los tiempos de la entrada, en milisegundos */
const ENTRADA = {
    /* Lo que tarda la última pieza de arriba: el botón de Instituciones */
    tarjetas: 1370 + 600,
    /* Cuándo le toca a Rayuela si ya estaba a la vista al arrancar la sección */
    rayuela: 1450,
    /* Lo que dura la apertura de Rayuela, contado desde su propia demora */
    adentroDeRayuela: 640 + 800,
    /* El chat habla cuando terminó de abrirse el bloque verde */
    chat: 1700,
};

/* La conversación de ejemplo: lo que se ve es siempre lo mismo */
const GUION = [
    { quien: "familia", texto: "Hola, quería saber por la inscripción para sala de 4." },
    { quien: "bot", texto: "¡Hola! Sí, tenemos vacantes para sala de 4. ¿Querés coordinar una entrevista con la dirección?", demora: 1100 },
    { quien: "familia", texto: "Sí, por la mañana." },
    { quien: "bot", texto: "Listo: martes 14 a las 10. Te mando el recordatorio por acá.", demora: 1200 },
    { quien: "cierre", texto: "✓  Entrevista agendada · la secretaría ya la ve en el panel" },
];

const dormir = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

/* Un logo por vez, con su fundido */
function iniciarCintas(raiz, quieto) {
    const cintas = [...raiz.querySelectorAll("[data-cinta]")];
    const relojes = [];

    for (const [orden, cinta] of cintas.entries()) {
        const logos = [...cinta.querySelectorAll(".cinta__logo")];
        if (!logos.length) continue;

        logos[0].classList.add("esta-activa");
        if (quieto || logos.length < 2) continue;

        let actual = 0;

        relojes.push({
            cinta,
            paso: PASO_DE_LOGO + orden * ESPERA_ENTRE_CINTAS,
            id: null,
            avanzar() {
                logos[actual].classList.remove("esta-activa");
                actual = (actual + 1) % logos.length;
                logos[actual].classList.add("esta-activa");
            },
        });
    }

    return {
        arrancar() {
            for (const reloj of relojes) {
                if (reloj.id === null) reloj.id = setInterval(() => reloj.avanzar(), reloj.paso);
            }
        },
        parar() {
            for (const reloj of relojes) {
                clearInterval(reloj.id);
                reloj.id = null;
            }
        },
    };
}

/* La conversación se escribe sola y vuelve a empezar */
function iniciarDemostracion(raiz, quieto) {
    const hilo = raiz.querySelector("[data-hilo]");
    if (!hilo) return { arrancar() {}, parar() {} };

    /* Sin movimiento la dejamos escrita de una vez */
    if (quieto) {
        for (const paso of GUION) hilo.append(burbujaDe(paso, false));
        return { arrancar() {}, parar() {} };
    }

    let corriendo = false;
    let vuelta = 0;

    async function correr() {
        const mia = ++vuelta;

        while (corriendo && mia === vuelta) {
            hilo.replaceChildren();
            await dormir(700);

            for (const paso of GUION) {
                if (!corriendo || mia !== vuelta) return;

                if (paso.demora) {
                    const puntos = document.createElement("div");
                    puntos.className = "escribiendo";
                    puntos.innerHTML = "<span></span><span></span><span></span>";
                    hilo.append(puntos);

                    await dormir(paso.demora);
                    if (!corriendo || mia !== vuelta) return;

                    puntos.remove();
                }

                hilo.append(burbujaDe(paso, true));
                await dormir(paso.quien === "cierre" ? 3400 : 1000);
            }
        }
    }

    return {
        arrancar() {
            if (corriendo) return;
            corriendo = true;
            correr();
        },
        parar() {
            corriendo = false;
        },
    };
}

function burbujaDe(paso, animada) {
    const burbuja = document.createElement("div");
    burbuja.className = "burbuja burbuja--" + paso.quien;
    burbuja.textContent = paso.texto;

    if (!animada) burbuja.style.cssText = "opacity: 1; translate: 0 0; animation: none";

    return burbuja;
}

/**
 * La entrada. Las clases las pone este módulo, así que sin JS la sección se ve
 * entera. Al terminar se quitan: ningún recorte queda tapando sombras ni
 * enlaces.
 */
function prepararEntrada(raiz, cuandoHableElChat) {
    const rayuela = raiz.querySelector(".rayuela");
    /* Miramos el bloque de comunicación, no la sección entera: es alta y si no
       el megáfono llamaría con las tarjetas todavía abajo del pliegue. */
    const comunicacion = raiz.querySelector(".comunicacion") ?? raiz;

    raiz.classList.add("esta-por-entrar");
    rayuela?.classList.add("esta-por-entrar");

    const abrirRayuela = (demora) => {
        if (!rayuela) {
            setTimeout(cuandoHableElChat, demora + ENTRADA.chat);
            return;
        }

        rayuela.style.setProperty("--demora", demora + "ms");
        rayuela.classList.remove("esta-por-entrar");
        rayuela.classList.add("esta-entrando");

        setTimeout(() => rayuela.classList.remove("esta-entrando"), demora + ENTRADA.adentroDeRayuela);
        setTimeout(cuandoHableElChat, demora + ENTRADA.chat);
    };

    const observadorSeccion = new IntersectionObserver(
        (entradas) => {
            if (!entradas[0].isIntersecting) return;
            observadorSeccion.disconnect();

            const arranque = performance.now();
            raiz.classList.remove("esta-por-entrar");
            raiz.classList.add("esta-entrando");
            setTimeout(() => raiz.classList.remove("esta-entrando"), ENTRADA.tarjetas);

            if (!rayuela) {
                abrirRayuela(ENTRADA.rayuela);
                return;
            }

            /* Si Rayuela ya se ve, entra a los 1450ms; si quedó abajo (sobre todo
               en el teléfono), espera a estar en pantalla y ahí se abre. */
            const observadorRayuela = new IntersectionObserver(
                (suyas) => {
                    if (!suyas[0].isIntersecting) return;
                    observadorRayuela.disconnect();
                    abrirRayuela(Math.max(0, ENTRADA.rayuela - (performance.now() - arranque)));
                },
                { threshold: 0.2 },
            );

            observadorRayuela.observe(rayuela);
        },
        { threshold: 0.3 },
    );

    observadorSeccion.observe(comunicacion);
}

export function iniciarAcompanamiento(raiz = document.querySelector("#como-acompanamos")) {
    if (!raiz) return;

    const quieto = prefiereMovimientoReducido();
    const cintas = iniciarCintas(raiz, quieto);
    const demostracion = iniciarDemostracion(raiz, quieto);

    if (quieto) return;

    const conObservador = "IntersectionObserver" in window;
    const conEntrada = conObservador && hayAnimacionesDeEntrada();

    let elChatPuedeHablar = !conEntrada;
    let laSeccionSeVe = !conObservador;

    function acomodar() {
        if (laSeccionSeVe && !document.hidden) {
            cintas.arrancar();
            if (elChatPuedeHablar) demostracion.arrancar();
        } else {
            cintas.parar();
            demostracion.parar();
        }
    }

    if (conEntrada) {
        prepararEntrada(raiz, () => {
            elChatPuedeHablar = true;
            acomodar();
        });
    }

    /* Sin observador no hay nada que esperar: todo arranca de una */
    if (!conObservador) {
        acomodar();
        return;
    }

    new IntersectionObserver(
        ([entrada]) => {
            laSeccionSeVe = entrada.isIntersecting;
            acomodar();
        },
        { threshold: 0.15 },
    ).observe(raiz);

    document.addEventListener("visibilitychange", acomodar);
}
