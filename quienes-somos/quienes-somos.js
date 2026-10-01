import { iniciarSitio } from "../recursos/js/principal.js";
import { hayAnimacionesDeEntrada } from "../recursos/js/utilidades/animaciones.js";
import { iniciarPilaresEscena } from "../recursos/js/componentes/pilares-escena.js";

const ANTES_DEL_GRAFICO = 220;

function iniciarPresentacion() {
    const presentacion = document.querySelector("[data-presentacion]");
    if (!presentacion) return;

    if (!hayAnimacionesDeEntrada()) return;

    const mostrar = () => presentacion.classList.add("grafico-visible");

    setTimeout(mostrar, ANTES_DEL_GRAFICO + 300);
    requestAnimationFrame(() => {
        requestAnimationFrame(() => setTimeout(mostrar, ANTES_DEL_GRAFICO));
    });
}

iniciarSitio();
iniciarPresentacion();
iniciarPilaresEscena();
