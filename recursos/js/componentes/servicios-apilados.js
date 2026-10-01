import { alScrollear } from "../utilidades/scroll.js";
import { prefiereMovimientoReducido } from "../utilidades/movimiento.js";

const GIRO_INICIAL = 30;
const ENTRADA = 1;
const LLEGADA = 0.25;

export function iniciarServiciosApilados(seccion = document.querySelector("[data-servicios]")) {
    if (!seccion) return;

    const paneles = [...seccion.querySelectorAll("[data-panel-servicio]")];
    if (!paneles.length || prefiereMovimientoReducido()) return;

    function girar() {
        const alto = window.innerHeight;

        paneles.forEach((panel) => {
            const lienzo = panel.querySelector("[data-lienzo-servicio]");
            if (!lienzo) return;

            const { top } = panel.getBoundingClientRect();
            const posicion = top / alto;
            const avance = Math.min(1, Math.max(0, (ENTRADA - posicion) / (ENTRADA - LLEGADA)));

            lienzo.style.setProperty("--giro", `${((1 - avance) * GIRO_INICIAL).toFixed(2)}deg`);
        });
    }

    alScrollear(girar);
    window.addEventListener("resize", girar, { passive: true });
    girar();
}
