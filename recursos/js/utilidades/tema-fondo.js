import { limitar } from "./movimiento.js";

const INICIO_TRANSICION = 0.6;
const FIN_TRANSICION = 0.2;

function progresoEntrada(bordeEnPx, altoVentana) {
    const posicion = bordeEnPx / altoVentana;
    const progreso = limitar((INICIO_TRANSICION - posicion) / (INICIO_TRANSICION - FIN_TRANSICION), 0, 1);

    return progreso * progreso * (3 - 2 * progreso);
}

export function crearTemaFondo() {
    const seccionesClaras = [...document.querySelectorAll('[data-tema-fondo="claro"]')];
    let temaClaroActivo = false;

    function calcular() {
        if (!seccionesClaras.length) return 0;

        const altoVentana = window.innerHeight;
        let valor = 0;

        for (const seccion of seccionesClaras) {
            const { top, bottom } = seccion.getBoundingClientRect();
            const entrada = progresoEntrada(top, altoVentana);
            const salida = progresoEntrada(bottom, altoVentana);

            valor = Math.max(valor, entrada - salida);
        }

        return valor;
    }

    function sincronizarInterfaz(valor) {
        if (!temaClaroActivo && valor > 0.55) {
            temaClaroActivo = true;
            document.body.classList.add("tema-claro");
        } else if (temaClaroActivo && valor < 0.45) {
            temaClaroActivo = false;
            document.body.classList.remove("tema-claro");
        }
    }

    return { calcular, sincronizarInterfaz };
}
