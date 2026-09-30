import { iniciarSitio } from "../recursos/js/principal.js";
import { hayAnimacionesDeEntrada } from "../recursos/js/utilidades/animaciones.js";
import { prefiereMovimientoReducido } from "../recursos/js/utilidades/movimiento.js";

const ETIQUETAS = {
    todo: "todos los proyectos",
    branding: "branding",
    web: "web",
    redes: "redes",
    produccion: "producción",
};

/**
 * Corre la función cuando las piezas ya tienen su lugar medible. Espera dos
 * fotogramas, pero también arranca un temporizador: en una pestaña de fondo
 * los fotogramas se congelan y las piezas quedarían invisibles.
 */
function enCuantoSePinte(funcion) {
    let hecho = false;
    const correr = () => {
        if (hecho) return;
        hecho = true;
        funcion();
    };

    setTimeout(correr, 250);
    requestAnimationFrame(() => requestAnimationFrame(correr));
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

    /**
     * Las piezas nacen detrás de la portada y se deslizan a su lugar: se mide
     * la distancia hasta ella y se guarda en --desde-x / --desde-y.
     */
    function animarProyecto(proyecto) {
        const piezas = piezasVisibles(proyecto);
        const portada = piezas[0];
        if (!portada) return;

        const origen = portada.getBoundingClientRect();

        piezas.forEach((pieza, indice) => {
            pieza.classList.remove("esta-entrando", "esta-puesta");
            void pieza.offsetWidth;

            if (indice > 0) {
                const destino = pieza.getBoundingClientRect();
                pieza.style.setProperty("--desde-x", `${Math.round(origen.left - destino.left)}px`);
                pieza.style.setProperty("--desde-y", `${Math.round(origen.top - destino.top)}px`);
                pieza.style.setProperty("--indice-pieza", indice - 1);
            }

            pieza.classList.add("esta-entrando", "esta-puesta");
        });
    }

    function mostrarSinAnimar(proyecto) {
        piezasVisibles(proyecto).forEach((pieza) => {
            pieza.classList.remove("esta-entrando");
            pieza.classList.add("esta-puesta");
        });
    }

    function animarVisibles({ conAnimacion }) {
        const enPantalla = proyectos.filter((proyecto) => !proyecto.hidden);

        enPantalla.forEach((proyecto) => {
            if (conAnimacion && !sinMovimiento) animarProyecto(proyecto);
            else mostrarSinAnimar(proyecto);
        });
    }

    function aplicarFiltro(filtro, { conAnimacion = true } = {}) {
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
        });

        if (aviso) {
            const cuantos = proyectos.filter((proyecto) => !proyecto.hidden).length;
            aviso.textContent = `Mostrando ${cuantos} proyectos de ${ETIQUETAS[filtro]}.`;
        }

        enCuantoSePinte(() => animarVisibles({ conAnimacion }));
    }

    filtros.forEach((boton) => {
        boton.addEventListener("click", () => {
            if (boton.dataset.filtro === filtroActual) return;
            aplicarFiltro(boton.dataset.filtro);
        });
    });

    /* Al llegar: cada proyecto entra cuando aparece en pantalla */
    const conEntrada = hayAnimacionesDeEntrada() && !sinMovimiento;
    aplicarFiltro("todo", { conAnimacion: false });

    if (!conEntrada || !("IntersectionObserver" in window)) {
        proyectos.forEach(mostrarSinAnimar);
        return;
    }

    proyectos.forEach((proyecto) => {
        piezasVisibles(proyecto).forEach((pieza) => pieza.classList.remove("esta-puesta"));
    });

    const observador = new IntersectionObserver(
        (entradas) => {
            entradas.forEach((entrada) => {
                if (!entrada.isIntersecting) return;
                animarProyecto(entrada.target);
                observador.unobserve(entrada.target);
            });
        },
        { rootMargin: "0px 0px -12% 0px", threshold: 0.15 },
    );

    proyectos.forEach((proyecto) => observador.observe(proyecto));
}

iniciarSitio();
iniciarPortfolio();
