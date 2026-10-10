import { tienePunteroFino } from "../utilidades/movimiento.js";

const TIEMPO_ABIERTA_EN_INTRO = 2800;

/* Compartimos el mismo menú en todas las páginas. El botón se agrega sólo
   cuando hay JS: sin él, los enlaces siguen disponibles. */
function iniciarMenuDesplegable(navegacion) {
    const cabecera = navegacion.closest(".cabecera");
    if (!cabecera || cabecera.querySelector("[data-menu-boton]")) return;

    const pantallaCompacta = window.matchMedia("(max-width: 1100px)");
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "cabecera__menu-boton";
    boton.dataset.menuBoton = "";
    navegacion.id ||= "navegacion-principal";
    boton.setAttribute("aria-controls", navegacion.id);
    navegacion.setAttribute("data-lenis-prevent", "");
    boton.innerHTML = '<span></span><span></span><span></span>';
    boton.querySelectorAll("span").forEach((linea) => linea.setAttribute("aria-hidden", "true"));
    cabecera.insertBefore(boton, navegacion);

    let abierto = false;

    function mostrar(valor, devolverFoco = false) {
        abierto = pantallaCompacta.matches && valor;
        cabecera.classList.toggle("menu-abierto", abierto);
        boton.setAttribute("aria-expanded", String(abierto));
        boton.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
        navegacion.inert = pantallaCompacta.matches && !abierto;
        if (devolverFoco) boton.focus();
    }

    boton.addEventListener("click", () => mostrar(!abierto));
    navegacion.addEventListener("click", (evento) => {
        if (abierto && evento.target.closest("a[href]")) mostrar(false, true);
    });
    document.addEventListener("keydown", (evento) => {
        if (evento.key !== "Escape" || !abierto) return;
        evento.preventDefault();
        mostrar(false, true);
    });
    document.addEventListener("pointerdown", (evento) => {
        if (abierto && !cabecera.contains(evento.target)) {
            mostrar(false, navegacion.contains(document.activeElement));
        }
    });
    cabecera.addEventListener("focusout", (evento) => {
        if (abierto && evento.relatedTarget && !cabecera.contains(evento.relatedTarget)) mostrar(false);
    });
    pantallaCompacta.addEventListener("change", () => {
        const focoEnMenu = navegacion.contains(document.activeElement);
        const focoEnBoton = document.activeElement === boton;
        mostrar(false, pantallaCompacta.matches && focoEnMenu);
        if (!pantallaCompacta.matches && focoEnBoton) cabecera.querySelector(".cabecera__logo")?.focus();
    });

    mostrar(false);
    cabecera.classList.add("con-menu-desplegable");
}

export function iniciarNavegacionIndice(navegacion = document.querySelector("[data-navegacion-indice]")) {
    if (!navegacion) return;

    iniciarMenuDesplegable(navegacion);

    if (!tienePunteroFino()) return;

    navegacion.classList.add("esta-abierta");

    const plegar = () => navegacion.classList.remove("esta-abierta");
    const temporizador = setTimeout(plegar, TIEMPO_ABIERTA_EN_INTRO);

    navegacion.addEventListener(
        "pointerleave",
        () => {
            clearTimeout(temporizador);
            plegar();
        },
        { once: true },
    );
}
