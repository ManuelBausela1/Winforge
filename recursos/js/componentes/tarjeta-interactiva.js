import { limitar, prefiereMovimientoReducido, tienePunteroFino } from "../utilidades/movimiento.js";

const CONFIGURACION = {
    giroMaximo: 7,
};

function seguirPuntero(tarjeta, evento) {
    const limites = tarjeta.getBoundingClientRect();
    const x = (evento.clientX - limites.left) / limites.width;
    const y = (evento.clientY - limites.top) / limites.height;

    tarjeta.style.setProperty("--puntero-x", `${(x * 100).toFixed(1)}%`);
    tarjeta.style.setProperty("--puntero-y", `${(y * 100).toFixed(1)}%`);

    const giroY = limitar((x - 0.5) * 2, -1, 1) * CONFIGURACION.giroMaximo;
    const giroX = limitar((y - 0.5) * 2, -1, 1) * -CONFIGURACION.giroMaximo;

    tarjeta.style.setProperty("--giro-y", `${giroY.toFixed(2)}deg`);
    tarjeta.style.setProperty("--giro-x", `${giroX.toFixed(2)}deg`);
}

function soltarTarjeta(tarjeta) {
    tarjeta.style.setProperty("--giro-x", "0deg");
    tarjeta.style.setProperty("--giro-y", "0deg");
}

export function iniciarTarjetasInteractivas(tarjetas = document.querySelectorAll("[data-tarjeta-interactiva]")) {
    if (!tarjetas.length || !tienePunteroFino() || prefiereMovimientoReducido()) return;

    tarjetas.forEach((tarjeta) => {
        tarjeta.addEventListener("pointermove", (evento) => seguirPuntero(tarjeta, evento), { passive: true });
        tarjeta.addEventListener("pointerleave", () => soltarTarjeta(tarjeta));
    });
}
