/* Las fotos del fondo de la portada se turnan en un ciclo sin fin. */

const ESPERA = 5200;

export function iniciarPortadaServicio() {
    const figuras = document.querySelectorAll("[data-portada-rotativa]");
    if (!figuras.length) return;

    const quietud = window.matchMedia("(prefers-reduced-motion: reduce)");

    for (const figura of figuras) {
        const fotos = [...figura.querySelectorAll(".servicio-portada__foto")];
        if (fotos.length < 2) continue;

        let actual = Math.max(
            0,
            fotos.findIndex((foto) => foto.classList.contains("esta-visible")),
        );
        let reloj = null;

        function pasar() {
            fotos[actual].classList.remove("esta-visible");
            actual = (actual + 1) % fotos.length;
            fotos[actual].classList.add("esta-visible");
        }

        function arrancar() {
            if (reloj !== null || quietud.matches) return;
            reloj = window.setInterval(pasar, ESPERA);
        }

        function frenar() {
            if (reloj === null) return;
            window.clearInterval(reloj);
            reloj = null;
        }

        /* Si piden menos movimiento, el fondo se queda quieto */
        quietud.addEventListener("change", () => (quietud.matches ? frenar() : arrancar()));

        arrancar();
    }
}
