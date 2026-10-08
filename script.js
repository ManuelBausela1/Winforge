import { iniciarSitio } from "./recursos/js/principal.js";
import { iniciarLogo3d } from "./recursos/js/componentes/logo-3d.js";
import { prepararFraseAnimada } from "./recursos/js/componentes/revelar-frase.js";
import { iniciarTituloParticulas } from "./recursos/js/componentes/titulo-particulas.js";
import { iniciarProcesoHorizontal } from "./recursos/js/componentes/proceso-horizontal.js";
import { iniciarCarruselMarcas } from "./recursos/js/componentes/carrusel-marcas.js";
import { iniciarServiciosApilados } from "./recursos/js/componentes/servicios-apilados.js";
import { iniciarSeccionActiva } from "./recursos/js/componentes/seccion-activa.js";
import { iniciarAcompanamiento } from "./recursos/js/componentes/acompanamiento.js";
import { iniciarCasosEntrada } from "./recursos/js/componentes/casos-entrada.js";
import { prefiereMovimientoReducido } from "./recursos/js/utilidades/movimiento.js";
import { hayAnimacionesDeEntrada } from "./recursos/js/utilidades/animaciones.js";

const TIEMPOS_HERO = {
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

    if (!conEntrada) {

        iniciarTituloParticulas(hero, { conEntrada: false });
        return;
    }

    const frase = prepararFraseAnimada(hero.querySelector("[data-frase-animada]"));

    hero.classList.add("logo-visible");

    await iniciarTituloParticulas(hero);
    await esperarPintado();

    frase?.revelar();
    await pausa(TIEMPOS_HERO.antesDeLosBotones);

    hero.classList.add("acciones-visibles");
}

iniciarSitio();
iniciarHero();
iniciarLogo3d();
iniciarProcesoHorizontal();
document.querySelectorAll("[data-carrusel-marcas]").forEach(iniciarCarruselMarcas);
iniciarServiciosApilados();
iniciarSeccionActiva();
iniciarAcompanamiento();
iniciarCasosEntrada();
