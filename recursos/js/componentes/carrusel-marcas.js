import { limitar, prefiereMovimientoReducido } from "../utilidades/movimiento.js";

const CONFIGURACION = {
    velocidadBase: -1,
    rozamiento: 0.94,
    radioFoco: 1.5,
    minimoCopias: 2,
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
    let arrastreExtra = 0;
    let cercaniaAnterior = new WeakMap();
    let idFotograma = null;

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

        if (anchoSerie > 0) {
            posicion = ((posicion % anchoSerie) + anchoSerie) % anchoSerie;
        }

        pista.style.transform = `translate3d(${-posicion}px, 0, 0)`;
        repartirFoco();

        idFotograma = requestAnimationFrame(animar);
    }

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

            }
            carrusel.classList.add("esta-arrastrando");
        });

        carrusel.addEventListener("pointermove", (evento) => {
            if (!arrastrando) return;

            const desplazamiento = evento.clientX - ultimoX;
            ultimoX = evento.clientX;

            posicion -= desplazamiento;
            arrastreExtra = -desplazamiento * 0.6;
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
