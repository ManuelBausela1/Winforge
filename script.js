import { iniciarSitio } from "./recursos/js/principal.js";
import { prepararFraseAnimada } from "./recursos/js/componentes/revelar-frase.js";
import { iniciarLogo3d } from "./recursos/js/componentes/logo-3d.js";
import { iniciarTituloParticulas } from "./recursos/js/componentes/titulo-particulas.js";
import { iniciarProcesoHorizontal } from "./recursos/js/componentes/proceso-horizontal.js";
import { iniciarCarruselMarcas } from "./recursos/js/componentes/carrusel-marcas.js";
import { iniciarServiciosApilados } from "./recursos/js/componentes/servicios-apilados.js";
import { iniciarSeccionActiva } from "./recursos/js/componentes/seccion-activa.js";
import { prefiereMovimientoReducido } from "./recursos/js/utilidades/movimiento.js";
import { hayAnimacionesDeEntrada } from "./recursos/js/utilidades/animaciones.js";

const TIEMPOS_HERO = {
    duracionFrase: 900,
    antesDeLosBotones: 900,
};

function esperar(milisegundos) {
    return new Promise((resolver) => setTimeout(resolver, milisegundos));
}

function esperarPintado() {
    return new Promise((resolver) => requestAnimationFrame(() => requestAnimationFrame(resolver)));
}

async function iniciarHero() {
    const hero = document.querySelector("[data-hero]");
    if (!hero) return;

    const conEntrada = hayAnimacionesDeEntrada();
    const sinAnimacion = prefiereMovimientoReducido() || !conEntrada;
    const pausa = (milisegundos) => esperar(sinAnimacion ? 0 : milisegundos);

    hero.querySelectorAll(".hero__accion").forEach((accion, indice) => {
        accion.style.setProperty("--indice-accion", indice);
    });

    iniciarLogo3d(hero.querySelector("[data-logo-3d]"));

    if (!conEntrada) {

        iniciarTituloParticulas(hero, { conEntrada: false });
        return;
    }

    const frase = prepararFraseAnimada(hero.querySelector("[data-frase-animada]"));

    await iniciarTituloParticulas(hero);
    await esperarPintado();

    frase?.revelar();
    await pausa(TIEMPOS_HERO.duracionFrase);

    hero.classList.add("logo-visible");
    await pausa(TIEMPOS_HERO.antesDeLosBotones);

    hero.classList.add("acciones-visibles");
}

iniciarSitio();
iniciarHero();
iniciarProcesoHorizontal();
iniciarCarruselMarcas();
iniciarServiciosApilados();
iniciarSeccionActiva();
