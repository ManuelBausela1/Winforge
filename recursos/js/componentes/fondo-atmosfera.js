/* ==========================================================================
   COMPONENTE — FONDO ATMÓSFERA
   Dos capas:
   1. Fondo fluido (WebGL): humo abstracto quieto, "pegado" a la página como
      un lienzo largo. No se anima solo: al scrollear sube a la par del
      contenido y aparecen nuevas figuras. Se redibuja en el mismo instante
      en que se mueve la página, para que no quede ni un fotograma atrasado.
   2. Partículas (canvas 2D): chispas blancas y naranjas que flotan solas y
      se desplazan con el scroll a distintas velocidades (profundidad).

   Tema claro: las secciones con data-tema-fondo="claro" vuelven el fondo
   blanco con las figuras en negro y algo de eucalipto. La transición sigue
   las formas del humo, como tinta que se expande.
   ========================================================================== */

import { crearFondoFluido } from "./fondo-fluido.js";
import { alScrollear, estadoScroll } from "../utilidades/scroll-suave.js";
import { crearTemaFondo } from "../utilidades/tema-fondo.js";
import { interpolar, moduloPositivo, prefiereMovimientoReducido } from "../utilidades/movimiento.js";

const CONFIGURACION = {
    velocidadParallaxMinima: 0.3, // Partículas lejanas: se mueven al 30 % del scroll
    velocidadParallaxMaxima: 0.9, // Partículas cercanas: casi a la par del contenido
    densidadParticulas: 1 / 10000, // Una partícula cada 10000 px²
    maximoParticulas: 170,
    proporcionNaranjas: 0.35,
    inerciaTema: 0.08,
    resolucionMaximaParticulas: 1.5,
};

const COLOR_NARANJA = "255, 165, 41";

// Polvo: blanco sobre el fondo oscuro, carbón sobre el claro
const COLOR_POLVO = [[255, 255, 255], [28, 28, 28]];

function mezclarColor([origen, destino], proporcion) {
    const canal = (indice) => Math.round(origen[indice] + (destino[indice] - origen[indice]) * proporcion);
    return `${canal(0)}, ${canal(1)}, ${canal(2)}`;
}

export function iniciarFondoAtmosfera(raiz = document.querySelector("[data-fondo-atmosfera]")) {
    if (!raiz) return;

    const movimientoReducido = prefiereMovimientoReducido();
    const lienzoParticulas = raiz.querySelector("[data-particulas]");
    const contexto = lienzoParticulas.getContext("2d");
    const fondoFluido = crearFondoFluido(raiz.querySelector("[data-fluido]"));
    const temaFondo = crearTemaFondo();

    if (!fondoFluido) {
        raiz.classList.add("fondo-atmosfera--sin-webgl");
    }

    let ancho = 0;
    let alto = 0;
    let particulas = [];
    let idFotograma = null;
    let scrollDibujado = null;
    let temaClaro = 0;
    let temaDibujado = null;

    /* ----------------------------------------------------------------------
       Fondo fluido
       ---------------------------------------------------------------------- */

    function dibujarFluido({ forzar = false } = {}) {
        const scroll = estadoScroll.posicion;
        const sinCambios = scroll === scrollDibujado && temaClaro === temaDibujado;
        if (!fondoFluido || (!forzar && sinCambios)) return;

        fondoFluido.dibujar({ scroll: scroll / alto, temaClaro });
        scrollDibujado = scroll;
        temaDibujado = temaClaro;
    }

    /** Cuánto tema claro corresponde según las secciones visibles. */
    function actualizarTema() {
        const objetivo = temaFondo.calcular();
        const nuevo = movimientoReducido ? objetivo : interpolar(temaClaro, objetivo, CONFIGURACION.inerciaTema);

        if (Math.abs(nuevo - temaClaro) < 0.0015 && nuevo !== objetivo) return;

        temaClaro = Math.abs(nuevo - objetivo) < 0.0015 ? objetivo : nuevo;
        temaFondo.sincronizarInterfaz(temaClaro);
        dibujarFluido();
    }

    /* ----------------------------------------------------------------------
       Partículas
       ---------------------------------------------------------------------- */

    function crearParticula() {
        const esNaranja = Math.random() < CONFIGURACION.proporcionNaranjas;
        const profundidad = Math.random() ** 1.5; // Más partículas lejanas que cercanas

        return {
            x: Math.random() * ancho,
            y: Math.random() * alto,
            profundidad,
            esNaranja,
            radio: 0.5 + profundidad * (esNaranja ? 1.5 : 1.2),
            opacidadBase: 0.25 + profundidad * 0.6,
            // Las naranjas suben como chispas; las blancas flotan en cualquier dirección
            velocidadX: (Math.random() - 0.5) * 0.18,
            velocidadY: esNaranja
                ? -(0.12 + Math.random() * 0.35)
                : (Math.random() - 0.5) * 0.2,
            // Vaivén lateral suave
            amplitudVaiven: 4 + Math.random() * 10,
            frecuenciaVaiven: 0.3 + Math.random() * 0.6,
            fase: Math.random() * Math.PI * 2,
            velocidadTitileo: 0.6 + Math.random() * 1.6,
        };
    }

    function generarParticulas() {
        const cantidad = Math.min(
            Math.round(ancho * alto * CONFIGURACION.densidadParticulas),
            CONFIGURACION.maximoParticulas,
        );
        particulas = Array.from({ length: cantidad }, crearParticula);
    }

    function dibujarParticulas(tiempo) {
        contexto.clearRect(0, 0, ancho, alto);

        const segundos = tiempo / 1000;
        const scroll = estadoScroll.posicion;
        const colorPolvo = mezclarColor(COLOR_POLVO, temaClaro);
        const rangoParallax = CONFIGURACION.velocidadParallaxMaxima - CONFIGURACION.velocidadParallaxMinima;

        for (const particula of particulas) {
            if (!movimientoReducido) {
                particula.x += particula.velocidadX;
                particula.y += particula.velocidadY;
            }

            const vaiven = movimientoReducido
                ? 0
                : Math.sin(segundos * particula.frecuenciaVaiven + particula.fase) * particula.amplitudVaiven;

            const x = moduloPositivo(particula.x + vaiven, ancho);
            const parallax = CONFIGURACION.velocidadParallaxMinima + particula.profundidad * rangoParallax;
            const y = moduloPositivo(particula.y - scroll * parallax, alto);
            const titileo = movimientoReducido
                ? 1
                : 0.6 + 0.4 * Math.sin(segundos * particula.velocidadTitileo + particula.fase);
            const opacidad = particula.opacidadBase * titileo;
            const color = particula.esNaranja ? COLOR_NARANJA : colorPolvo;

            // Resplandor suave alrededor de las chispas naranjas
            if (particula.esNaranja && particula.profundidad > 0.35) {
                contexto.fillStyle = `rgba(${color}, ${opacidad * 0.18})`;
                contexto.beginPath();
                contexto.arc(x, y, particula.radio * 3.5, 0, Math.PI * 2);
                contexto.fill();
            }

            contexto.fillStyle = `rgba(${color}, ${opacidad})`;
            contexto.beginPath();
            contexto.arc(x, y, particula.radio, 0, Math.PI * 2);
            contexto.fill();
        }
    }

    /* ----------------------------------------------------------------------
       Ciclo de vida
       ---------------------------------------------------------------------- */

    function redimensionar() {
        const resolucion = Math.min(window.devicePixelRatio || 1, CONFIGURACION.resolucionMaximaParticulas);

        ancho = window.innerWidth;
        alto = window.innerHeight;

        lienzoParticulas.width = Math.round(ancho * resolucion);
        lienzoParticulas.height = Math.round(alto * resolucion);
        contexto.setTransform(resolucion, 0, 0, resolucion, 0, 0);

        fondoFluido?.redimensionar(ancho, alto);
        dibujarFluido({ forzar: true });
        generarParticulas();
    }

    function animar(tiempo) {
        actualizarTema();
        dibujarParticulas(tiempo);
        idFotograma = requestAnimationFrame(animar);
    }

    function pausarSiEstaOculta() {
        if (document.hidden) {
            cancelAnimationFrame(idFotograma);
            idFotograma = null;
        } else if (idFotograma === null) {
            idFotograma = requestAnimationFrame(animar);
        }
    }

    let temporizadorRedimension;
    window.addEventListener("resize", () => {
        clearTimeout(temporizadorRedimension);
        temporizadorRedimension = setTimeout(redimensionar, 150);
    });

    document.addEventListener("visibilitychange", pausarSiEstaOculta);
    alScrollear(() => dibujarFluido());

    redimensionar();
    idFotograma = requestAnimationFrame(animar);
}
