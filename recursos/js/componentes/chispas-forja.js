/**
 * Chispas de forja en el pie: brasas que suben, se apagan y vuelven a nacer.
 * Solo dibujan mientras el pie está a la vista.
 */

import { prefiereMovimientoReducido } from "../utilidades/movimiento.js";

const CONFIGURACION = {
    densidad: 1 / 9000,
    maximo: 70,
    minimo: 18,
    resolucionMaxima: 2,
};

const COLORES = ["255, 165, 41", "255, 122, 26", "255, 206, 128"];

const azar = (desde, hasta) => desde + Math.random() * (hasta - desde);

export function iniciarChispasForja(lienzo = document.querySelector("[data-chispas]")) {
    if (!lienzo || prefiereMovimientoReducido()) {
        lienzo?.remove();
        return;
    }

    const contexto = lienzo.getContext("2d", { alpha: true });
    if (!contexto) return;

    let ancho = 0;
    let alto = 0;
    let chispas = [];
    let idFotograma = null;
    let estaALaVista = false;

    /* Una chispa nace abajo, sube en diagonal y se va apagando */
    function nacer(repartidaEnAltura = false) {
        const vida = azar(2600, 7200);

        return {
            x: azar(-0.05, 1.05) * ancho,
            y: repartidaEnAltura ? azar(0, alto) : alto + azar(0, 40),
            radio: azar(0.7, 2.1),
            subida: azar(10, 34) / 1000,
            deriva: azar(-7, 7) / 1000,
            balanceo: azar(0, Math.PI * 2),
            ritmo: azar(0.6, 1.8) / 1000,
            color: COLORES[Math.floor(Math.random() * COLORES.length)],
            vida,
            edad: repartidaEnAltura ? azar(0, vida) : 0,
        };
    }

    function poblar() {
        const cuantas = Math.round(
            Math.min(CONFIGURACION.maximo, Math.max(CONFIGURACION.minimo, ancho * alto * CONFIGURACION.densidad)),
        );

        chispas = Array.from({ length: cuantas }, () => nacer(true));
    }

    function medir() {
        const caja = lienzo.getBoundingClientRect();
        if (!caja.width || !caja.height) return;

        const resolucion = Math.min(window.devicePixelRatio || 1, CONFIGURACION.resolucionMaxima);

        ancho = caja.width;
        alto = caja.height;
        lienzo.width = Math.round(ancho * resolucion);
        lienzo.height = Math.round(alto * resolucion);
        contexto.setTransform(resolucion, 0, 0, resolucion, 0, 0);

        poblar();
    }

    function dibujar(paso) {
        contexto.clearRect(0, 0, ancho, alto);
        contexto.globalCompositeOperation = "lighter";

        for (const chispa of chispas) {
            chispa.edad += paso;

            if (chispa.edad > chispa.vida || chispa.y < -20) {
                Object.assign(chispa, nacer());
                continue;
            }

            chispa.y -= chispa.subida * paso;
            chispa.balanceo += chispa.ritmo * paso;
            chispa.x += chispa.deriva * paso + Math.sin(chispa.balanceo) * 0.05;

            /* Entra, brilla y se apaga */
            const avance = chispa.edad / chispa.vida;
            const fuerza = Math.sin(avance * Math.PI);
            const alfa = fuerza * 0.75;

            const halo = contexto.createRadialGradient(chispa.x, chispa.y, 0, chispa.x, chispa.y, chispa.radio * 4.5);
            halo.addColorStop(0, `rgba(${chispa.color}, ${alfa.toFixed(3)})`);
            halo.addColorStop(1, `rgba(${chispa.color}, 0)`);

            contexto.fillStyle = halo;
            contexto.beginPath();
            contexto.arc(chispa.x, chispa.y, chispa.radio * 4.5, 0, Math.PI * 2);
            contexto.fill();

            contexto.fillStyle = `rgba(255, 228, 184, ${(alfa * 0.9).toFixed(3)})`;
            contexto.beginPath();
            contexto.arc(chispa.x, chispa.y, chispa.radio, 0, Math.PI * 2);
            contexto.fill();
        }

        contexto.globalCompositeOperation = "source-over";
    }

    let instanteAnterior = null;

    function animar(instante) {
        const paso = instanteAnterior === null ? 16 : Math.min(instante - instanteAnterior, 64);
        instanteAnterior = instante;

        dibujar(paso);
        idFotograma = requestAnimationFrame(animar);
    }

    function arrancar() {
        if (idFotograma !== null) return;
        instanteAnterior = null;
        idFotograma = requestAnimationFrame(animar);
    }

    function parar() {
        if (idFotograma === null) return;
        cancelAnimationFrame(idFotograma);
        idFotograma = null;
    }

    medir();

    /* El alto del pie cambia con el ancho de la ventana, así que escuchamos las dos cosas */
    if ("ResizeObserver" in window) new ResizeObserver(medir).observe(lienzo);
    window.addEventListener("resize", medir, { passive: true });

    /* Mientras el pie no se ve, no hay por qué dibujar */
    if ("IntersectionObserver" in window) {
        new IntersectionObserver(
            ([entrada]) => {
                estaALaVista = entrada.isIntersecting;

                if (!estaALaVista) {
                    parar();
                    return;
                }

                /* Al asomar medimos de nuevo: al cargar el pie podía no tener alto todavía */
                medir();
                arrancar();
            },
            { threshold: 0 },
        ).observe(lienzo);
    } else {
        arrancar();
    }
}
