/* ==========================================================================
   COMPONENTE — CARRUSEL DE MARCAS
   Un rollo horizontal infinito: las marcas avanzan solas y nunca se frenan.
   La que pasa por el centro se agranda, se enciende en blanco y muestra su
   nombre. Se puede correr a mano con el mouse o el dedo; al soltar, el rollo
   sigue de largo con la inercia del gesto.
   ========================================================================== */

import { limitar, prefiereMovimientoReducido } from "../utilidades/movimiento.js";

const CONFIGURACION = {
    velocidadBase: -1, // px por fotograma (negativo: hacia la izquierda)
    rozamiento: 0.94, // Cuánto se frena la inercia del arrastre
    radioFoco: 1.5, // Zona encendida, en anchos de marca (1.35 ≈ la del centro y un poco de sus vecinas)
    minimoCopias: 2, // Copias de la lista para que el rollo no tenga fin
};

export function iniciarCarruselMarcas(carrusel = document.querySelector("[data-carrusel-marcas]")) {
    if (!carrusel) return;

    const pista = carrusel.querySelector("[data-carrusel-pista]");
    const originales = [...pista.children];
    if (!originales.length) return;

    const movimientoReducido = prefiereMovimientoReducido();

    let marcas = originales;
    let anchoMarca = 0;
    let separacion = 0;
    let anchoSerie = 0;
    let posicion = 0;
    let arrastreExtra = 0; // Empuje que deja el gesto al soltar
    let cercaniaAnterior = new WeakMap();
    let idFotograma = null;

    /* ----------------------------------------------------------------------
       Copias: la lista se repite hasta cubrir el ancho visible
       ---------------------------------------------------------------------- */

    function prepararCopias() {
        pista.querySelectorAll("[data-copia]").forEach((copia) => copia.remove());

        anchoMarca = originales[0].getBoundingClientRect().width;
        separacion = parseFloat(getComputedStyle(pista).columnGap) || 0;
        anchoSerie = originales.length * (anchoMarca + separacion);

        const copiasNecesarias = Math.max(
            CONFIGURACION.minimoCopias,
            Math.ceil((carrusel.getBoundingClientRect().width * 2) / Math.max(anchoSerie, 1)),
        );

        for (let copia = 0; copia < copiasNecesarias; copia++) {
            originales.forEach((marca) => {
                const clon = marca.cloneNode(true);
                clon.setAttribute("aria-hidden", "true");
                clon.dataset.copia = "";
                pista.append(clon);
            });
        }

        marcas = [...pista.children];
    }

    /* ----------------------------------------------------------------------
       Movimiento
       ---------------------------------------------------------------------- */

    /** Enciende las marcas según lo cerca que estén del centro.
        La posición se calcula con números (todas miden lo mismo), así no
        hay que medir el DOM en cada fotograma. */
    function repartirFoco() {
        const centro = carrusel.getBoundingClientRect().width / 2;
        const paso = anchoMarca + separacion;
        const radio = paso * CONFIGURACION.radioFoco;

        let masCercana = null;
        let menorDistancia = Infinity;

        marcas.forEach((marca, indice) => {
            const centroMarca = indice * paso + anchoMarca / 2 - posicion;
            const distancia = Math.abs(centroMarca - centro);
            const cercania = limitar(1 - distancia / radio, 0, 1);

            // Solo se escribe cuando cambia: evita trabajo de más en cada fotograma
            if (Math.abs((cercaniaAnterior.get(marca) ?? -1) - cercania) > 0.01) {
                marca.style.setProperty("--cercania", cercania.toFixed(3));
                cercaniaAnterior.set(marca, cercania);
            }

            if (distancia < menorDistancia) {
                menorDistancia = distancia;
                masCercana = marca;
            }
        });

        marcas.forEach((marca) => marca.classList.toggle("esta-al-centro", marca === masCercana));
    }

    function animar() {
        const velocidad = (movimientoReducido ? 0 : CONFIGURACION.velocidadBase) + arrastreExtra;
        arrastreExtra *= CONFIGURACION.rozamiento;
        if (Math.abs(arrastreExtra) < 0.01) arrastreExtra = 0;

        posicion += velocidad;

        // El rollo no tiene fin: al completar una serie, vuelve a empezar
        if (anchoSerie > 0) {
            posicion = ((posicion % anchoSerie) + anchoSerie) % anchoSerie;
        }

        pista.style.transform = `translate3d(${-posicion}px, 0, 0)`;
        repartirFoco();

        idFotograma = requestAnimationFrame(animar);
    }

    /* ----------------------------------------------------------------------
       Arrastre con mouse o dedo
       ---------------------------------------------------------------------- */

    function iniciarArrastre() {
        let arrastrando = false;
        let ultimoX = 0;

        carrusel.addEventListener("pointerdown", (evento) => {
            arrastrando = true;
            ultimoX = evento.clientX;
            arrastreExtra = 0;
            try {
                carrusel.setPointerCapture(evento.pointerId);
            } catch {
                // Algunos punteros no admiten captura: el arrastre igual funciona
            }
            carrusel.classList.add("esta-arrastrando");
        });

        carrusel.addEventListener("pointermove", (evento) => {
            if (!arrastrando) return;

            const desplazamiento = evento.clientX - ultimoX;
            ultimoX = evento.clientX;

            posicion -= desplazamiento;
            arrastreExtra = -desplazamiento * 0.6; // Queda como inercia al soltar
        });

        const soltar = () => {
            arrastrando = false;
            carrusel.classList.remove("esta-arrastrando");
        };

        carrusel.addEventListener("pointerup", soltar);
        carrusel.addEventListener("pointercancel", soltar);
        carrusel.addEventListener("pointerleave", soltar);
        carrusel.addEventListener("dragstart", (evento) => evento.preventDefault());
    }

    /* ----------------------------------------------------------------------
       Ciclo de vida
       ---------------------------------------------------------------------- */

    function pausarSiEstaOculta() {
        if (document.hidden) {
            cancelAnimationFrame(idFotograma);
            idFotograma = null;
        } else if (idFotograma === null) {
            idFotograma = requestAnimationFrame(animar);
        }
    }

    let temporizador;
    new ResizeObserver(() => {
        clearTimeout(temporizador);
        temporizador = setTimeout(prepararCopias, 150);
    }).observe(carrusel);

    document.addEventListener("visibilitychange", pausarSiEstaOculta);

    prepararCopias();
    iniciarArrastre();
    idFotograma = requestAnimationFrame(animar);
}
