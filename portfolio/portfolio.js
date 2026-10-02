import { iniciarSitio } from "../recursos/js/principal.js";
import { prefiereMovimientoReducido } from "../recursos/js/utilidades/movimiento.js";

const ETIQUETAS = {
    todo: "todos los proyectos",
    branding: "identidad",
    web: "web",
    redes: "redes",
    produccion: "producción",
};

const TEXTOS_ACCION = {
    cerrado: "Ver proyecto",
    abierto: "Ocultar proyecto",
};

/**
 * Corre la función cuando las piezas ya tienen su lugar medible. Espera dos
 * fotogramas, pero también arranca un temporizador: en una pestaña de fondo
 * el navegador congela los fotogramas y la galería se quedaría invisible.
 */
function enCuantoSePinte(hacer) {
    let hecho = false;

    const unaVez = () => {
        if (hecho) return;
        hecho = true;
        hacer();
    };

    setTimeout(unaVez, 250);
    requestAnimationFrame(() => requestAnimationFrame(unaVez));
}

function iniciarPortfolio(seccion = document.querySelector("[data-portfolio]")) {
    if (!seccion) return;

    const filtros = [...seccion.querySelectorAll("[data-filtro]")];
    const proyectos = [...seccion.querySelectorAll("[data-proyecto]")];
    const aviso = seccion.querySelector("[data-aviso-filtro]");
    const sinMovimiento = prefiereMovimientoReducido();

    let filtroActual = "todo";

    function piezasVisibles(proyecto) {
        return [...proyecto.querySelectorAll(".portfolio__pieza")].filter((pieza) => !pieza.hidden);
    }

    /* Las piezas suben a su lugar, una detrás de otra. */
    function animarProyecto(proyecto) {
        const piezas = piezasVisibles(proyecto);
        if (!piezas.length) return;

        piezas.forEach((pieza, indice) => {
            pieza.classList.remove("esta-entrando", "esta-puesta");
            void pieza.offsetWidth;

            pieza.style.setProperty("--indice-pieza", indice);
            pieza.classList.add("esta-entrando", "esta-puesta");
        });
    }

    function mostrarSinAnimar(proyecto) {
        piezasVisibles(proyecto).forEach((pieza) => {
            pieza.classList.remove("esta-entrando");
            pieza.classList.add("esta-puesta");
        });
    }

    function partesDe(proyecto) {
        return {
            trabajo: proyecto.querySelector("[data-trabajo]"),
            boton: proyecto.querySelector("[data-ver-trabajo]"),
        };
    }

    function abrir(proyecto) {
        const { trabajo, boton } = partesDe(proyecto);
        if (!trabajo || !boton) return;

        trabajo.hidden = false;
        proyecto.classList.add("esta-abierto");
        boton.setAttribute("aria-expanded", "true");
        boton.querySelector(".boton__texto").textContent = TEXTOS_ACCION.abierto;

        enCuantoSePinte(() => (sinMovimiento ? mostrarSinAnimar(proyecto) : animarProyecto(proyecto)));
    }

    function cerrar(proyecto) {
        const { trabajo, boton } = partesDe(proyecto);
        if (!trabajo || !boton) return;

        trabajo.hidden = true;
        proyecto.classList.remove("esta-abierto");
        boton.setAttribute("aria-expanded", "false");
        boton.querySelector(".boton__texto").textContent = TEXTOS_ACCION.cerrado;
    }

    function aplicarFiltro(filtro) {
        filtroActual = filtro;

        filtros.forEach((boton) => boton.setAttribute("aria-pressed", String(boton.dataset.filtro === filtro)));

        proyectos.forEach((proyecto) => {
            const categorias = proyecto.dataset.categorias.split(" ");
            const entra = filtro === "todo" || categorias.includes(filtro);
            proyecto.hidden = !entra;

            proyecto.querySelectorAll(".portfolio__pieza").forEach((pieza) => {
                const suya = pieza.dataset.categoria;
                pieza.hidden = !(suya === "portada" || filtro === "todo" || suya === filtro);
            });

            cerrar(proyecto);
        });

        if (aviso) {
            const cuantos = proyectos.filter((proyecto) => !proyecto.hidden).length;
            aviso.textContent = `Mostrando ${cuantos} proyectos de ${ETIQUETAS[filtro]}.`;
        }
    }

    filtros.forEach((boton) => {
        boton.addEventListener("click", () => {
            if (boton.dataset.filtro === filtroActual) return;
            aplicarFiltro(boton.dataset.filtro);
        });
    });

    proyectos.forEach((proyecto) => {
        const { boton } = partesDe(proyecto);
        if (!boton) return;

        boton.addEventListener("click", () => {
            if (proyecto.classList.contains("esta-abierto")) cerrar(proyecto);
            else abrir(proyecto);
        });
    });

    /* Las páginas de servicio enlazan con ?filtro=... para llegar acá con su
       categoría ya elegida. */
    function filtroDelEnlace() {
        const pedido = new URLSearchParams(location.search).get("filtro");
        return pedido && pedido in ETIQUETAS ? pedido : "todo";
    }

    aplicarFiltro(filtroDelEnlace());

    /* Al llegar desde otra página con #caso-..., ese proyecto abre solo. */
    function abrirElDelEnlace() {
        const id = decodeURIComponent(location.hash.replace("#", ""));
        if (!id) return;

        const proyecto = proyectos.find((uno) => uno.id === id);
        if (!proyecto) return;

        /* Si el filtro vigente lo deja afuera, mostramos todo antes de abrirlo. */
        if (proyecto.hidden) aplicarFiltro("todo");

        abrir(proyecto);
        setTimeout(() => proyecto.scrollIntoView({ block: "start", behavior: "smooth" }), 120);
    }

    window.addEventListener("hashchange", abrirElDelEnlace);
    abrirElDelEnlace();
}

iniciarSitio();
iniciarPortfolio();
