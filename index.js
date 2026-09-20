/* ==========================================================================
   WINFORGE — PÁGINA DE INICIO
   ========================================================================== */

import { iniciarSitio } from "./recursos/js/principal.js";
import { prepararFraseAnimada } from "./recursos/js/componentes/revelar-frase.js";
import { iniciarLogo3d } from "./recursos/js/componentes/logo-3d.js";
import { iniciarTituloParticulas } from "./recursos/js/componentes/titulo-particulas.js";
import { iniciarPasosUniformes } from "./recursos/js/componentes/pasos-uniformes.js";
import { iniciarCarruselMarcas } from "./recursos/js/componentes/carrusel-marcas.js";
import { iniciarEleccionServicios } from "./recursos/js/componentes/eleccion-servicios.js";
import { iniciarSeccionActiva } from "./recursos/js/componentes/seccion-activa.js";
import { prefiereMovimientoReducido } from "./recursos/js/utilidades/movimiento.js";
import { hayAnimacionesDeEntrada } from "./recursos/js/utilidades/animaciones.js";

/* --------------------------------------------------------------------------
   Hero
   Secuencia de aparición (cada paso espera al anterior):
   1. "Winforge" se forma con partículas.
   2. La frase aparece palabra por palabra.
   3. El logo se revela de izquierda a derecha.
   4. Los botones entran con un zoom in.
   -------------------------------------------------------------------------- */

const TIEMPOS_HERO = {
    retrasoPorPalabra: 60, // ms entre palabras de la frase (coincide con el CSS)
    duracionPalabra: 700, // ms hasta que la última palabra se lee bien
    antesDeLosBotones: 900, // ms desde que empieza a revelarse el logo
};

function esperar(milisegundos) {
    return new Promise((resolver) => setTimeout(resolver, milisegundos));
}

/** Espera dos fotogramas: garantiza que el estado inicial se pinte antes de animar. */
function esperarPintado() {
    return new Promise((resolver) => requestAnimationFrame(() => requestAnimationFrame(resolver)));
}

async function iniciarHero() {
    const hero = document.querySelector("[data-hero]");
    if (!hero) return;

    // En una visita repetida el hero ya está puesto: nada se secuencia
    const conEntrada = hayAnimacionesDeEntrada();
    const sinAnimacion = prefiereMovimientoReducido() || !conEntrada;
    const pausa = (milisegundos) => esperar(sinAnimacion ? 0 : milisegundos);

    hero.querySelectorAll(".hero__accion").forEach((accion, indice) => {
        accion.style.setProperty("--indice-accion", indice);
    });

    iniciarLogo3d(hero.querySelector("[data-logo-3d]"));

    if (!conEntrada) {
        // La palabra aparece armada; el mouse la sigue apartando igual.
        // Sin la clase "animar" el CSS no esconde nada, así que no hay
        // secuencia que disparar: el hero ya se ve completo.
        iniciarTituloParticulas(hero, { conEntrada: false });
        return;
    }

    const frase = prepararFraseAnimada(hero.querySelector("[data-frase-animada]"));

    // 1. Winforge
    await iniciarTituloParticulas(hero);
    await esperarPintado();

    // 2. Frase
    frase?.revelar();
    const palabras = frase?.cantidadPalabras ?? 0;
    await pausa(palabras * TIEMPOS_HERO.retrasoPorPalabra + TIEMPOS_HERO.duracionPalabra);

    // 3. Logo
    hero.classList.add("logo-visible");
    await pausa(TIEMPOS_HERO.antesDeLosBotones);

    // 4. Botones
    hero.classList.add("acciones-visibles");
}

/* --------------------------------------------------------------------------
   Arranque
   -------------------------------------------------------------------------- */

iniciarSitio();
iniciarHero();
iniciarPasosUniformes();
iniciarCarruselMarcas();
iniciarEleccionServicios();
iniciarSeccionActiva();
