/* Las formas abstractas quedan apagadas: la página pedía un tono más
   institucional. Para volver a encenderlas, poner FORMAS_ABSTRACTAS en true
   y descomentar el import. */
// import { crearFondoFluido } from "./fondo-fluido.js";
import { alScrollear, estadoScroll } from "../utilidades/scroll.js";
import { crearTemaFondo } from "../utilidades/tema-fondo.js";
import { interpolar, moduloPositivo, prefiereMovimientoReducido } from "../utilidades/movimiento.js";

const FORMAS_ABSTRACTAS = false;

const CONFIGURACION = {
    velocidadParallaxMinima: 0.3,
    velocidadParallaxMaxima: 0.9,
    densidadParticulas: 1 / 22000,
    maximoParticulas: 80,
    proporcionBrillantes: 0.35,
    inerciaTema: 0.08,
    resolucionMaximaParticulas: 1.5,
};

const COLOR_ESTRELLA = "129, 161, 152";
const COLOR_ESTRELLA_VIVA = "168, 201, 190";

export function iniciarFondoAtmosfera(raiz = document.querySelector("[data-fondo-atmosfera]")) {
    if (!raiz) return;

    const movimientoReducido = prefiereMovimientoReducido();
    const conEstrellas = !raiz.hasAttribute("data-sin-particulas");
    const lienzoParticulas = raiz.querySelector("[data-particulas]");

    if (!conEstrellas) lienzoParticulas?.remove();

    const contexto = conEstrellas ? lienzoParticulas.getContext("2d") : null;
    const fondoFluido = FORMAS_ABSTRACTAS ? crearFondoFluido(raiz.querySelector("[data-fluido]")) : null;
    const temaFondo = crearTemaFondo();

    if (!fondoFluido) {
        raiz.classList.add("fondo-atmosfera--sin-webgl");
        raiz.querySelector("[data-fluido]")?.remove();
    }

    let ancho = 0;
    let alto = 0;
    let particulas = [];
    let idFotograma = null;
    let scrollDibujado = null;
    let temaClaro = 0;
    let temaDibujado = null;

    function dibujarFluido({ forzar = false } = {}) {
        const scroll = estadoScroll.posicion;
        const sinCambios = scroll === scrollDibujado && temaClaro === temaDibujado;
        if (!fondoFluido || (!forzar && sinCambios)) return;

        fondoFluido.dibujar({ scroll: scroll / alto, temaClaro });
        scrollDibujado = scroll;
        temaDibujado = temaClaro;
    }

    function actualizarTema() {
        const objetivo = temaFondo.calcular();
        const nuevo = movimientoReducido ? objetivo : interpolar(temaClaro, objetivo, CONFIGURACION.inerciaTema);

        if (Math.abs(nuevo - temaClaro) < 0.0015 && nuevo !== objetivo) return;

        temaClaro = Math.abs(nuevo - objetivo) < 0.0015 ? objetivo : nuevo;
        temaFondo.sincronizarInterfaz(temaClaro);
        dibujarFluido();
    }

    function crearParticula() {
        const esViva = Math.random() < CONFIGURACION.proporcionBrillantes;
        const profundidad = Math.random() ** 1.5;

        return {
            x: Math.random() * ancho,
            y: Math.random() * alto,
            profundidad,
            esViva,
            radio: 0.6 + profundidad * (esViva ? 1.7 : 1.3),
            opacidadBase: 0.45 + profundidad * 0.5,

            velocidadX: (Math.random() - 0.5) * 0.18,
            velocidadY: esViva
                ? -(0.12 + Math.random() * 0.35)
                : (Math.random() - 0.5) * 0.2,

            amplitudVaiven: 4 + Math.random() * 10,
            frecuenciaVaiven: 0.3 + Math.random() * 0.6,
            fase: Math.random() * Math.PI * 2,
            velocidadTitileo: 0.6 + Math.random() * 1.6,
        };
    }

    function generarParticulas() {
        if (!conEstrellas) return;

        const cantidad = Math.min(
            Math.round(ancho * alto * CONFIGURACION.densidadParticulas),
            CONFIGURACION.maximoParticulas,
        );
        particulas = Array.from({ length: cantidad }, crearParticula);
    }

    function dibujarParticulas(tiempo) {
        if (!conEstrellas) return;

        contexto.clearRect(0, 0, ancho, alto);

        const segundos = tiempo / 1000;
        const scroll = estadoScroll.posicion;
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
            const color = particula.esViva ? COLOR_ESTRELLA_VIVA : COLOR_ESTRELLA;

            if (particula.esViva && particula.profundidad > 0.35) {
                contexto.fillStyle = `rgba(${color}, ${opacidad * 0.24})`;
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

    function redimensionar() {
        const resolucion = Math.min(window.devicePixelRatio || 1, CONFIGURACION.resolucionMaximaParticulas);

        ancho = window.innerWidth;
        alto = window.innerHeight;

        if (conEstrellas) {
            lienzoParticulas.width = Math.round(ancho * resolucion);
            lienzoParticulas.height = Math.round(alto * resolucion);
            contexto.setTransform(resolucion, 0, 0, resolucion, 0, 0);
        }

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

    /* Las estrellas no se ven sobre el hero ni en las secciones marcadas
       con data-sin-estrellas: entran al dejar el hero y se apagan al
       llegar a esas zonas. */
    const hero = document.querySelector("[data-hero]");
    const zonasSinEstrellas = [...document.querySelectorAll("[data-sin-estrellas]")];

    function ajustarEstrellas() {
        if (!conEstrellas) return;

        const altoVentana = window.innerHeight;
        let presencia = 1;

        if (hero) {
            const altoHero = hero.offsetHeight || altoVentana;
            presencia = window.scrollY / (altoHero * 0.55);
        }

        for (const zona of zonasSinEstrellas) {
            const { top } = zona.getBoundingClientRect();
            const cercania = (altoVentana * 0.9 - top) / (altoVentana * 0.6);

            presencia = Math.min(presencia, 1 - cercania);
        }

        raiz.style.setProperty("--presencia-estrellas", Math.min(1, Math.max(0, presencia)).toFixed(3));
    }

    document.addEventListener("visibilitychange", pausarSiEstaOculta);
    alScrollear(() => {
        dibujarFluido();
        ajustarEstrellas();
    });
    ajustarEstrellas();

    redimensionar();
    idFotograma = requestAnimationFrame(animar);
}
