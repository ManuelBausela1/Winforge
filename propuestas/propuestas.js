import { iniciarSitio } from "../recursos/js/principal.js";
import { iniciarFormularioContacto } from "../recursos/js/componentes/formulario-contacto.js";

/* ---------- Qué propuesta se muestra ---------- */

function iniciarSelector() {
    const opciones = [...document.querySelectorAll("[data-propuesta]")];
    const paneles = [...document.querySelectorAll("[data-panel]")];
    if (!opciones.length) return;

    function mostrar(cual, conSalto = true) {
        for (const opcion of opciones) {
            opcion.setAttribute("aria-pressed", String(opcion.dataset.propuesta === cual));
        }

        for (const panel of paneles) {
            panel.hidden = panel.dataset.panel !== cual;
        }

        if (history.replaceState) history.replaceState(null, "", "#" + cual);

        /* Lo revelado vuelve a medirse: el panel recién abierto estaba oculto */
        revelar();

        if (conSalto) {
            document.querySelector(".portada-propuestas").scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    for (const opcion of opciones) {
        opcion.addEventListener("click", () => mostrar(opcion.dataset.propuesta));
    }

    /* El home entra con #marcas, #colegios o #rayuela */
    function atenderElEnlace(conSalto) {
        const pedido = location.hash.replace("#", "");
        if (paneles.some((p) => p.dataset.panel === pedido)) mostrar(pedido, conSalto);
    }

    /* Y si el hash cambia sin recargar, el panel acompaña */
    window.addEventListener("hashchange", () => atenderElEnlace(false));
    atenderElEnlace(false);
}

/* ---------- La necesidad elegida resalta su plan ---------- */

function iniciarNecesidades() {
    const grupos = [
        { botones: "[data-apunta]", atributo: "apunta", ficha: "data-plan" },
        { botones: "[data-apunta-edu]", atributo: "apuntaEdu", ficha: "data-nivel" },
    ];

    for (const grupo of grupos) {
        const botones = [...document.querySelectorAll(grupo.botones)];
        if (!botones.length) continue;

        let elegido = null;

        for (const boton of botones) {
            boton.addEventListener("click", () => {
                const cual = boton.dataset[grupo.atributo];
                elegido = elegido === cual ? null : cual;

                for (const otro of botones) {
                    otro.setAttribute("aria-pressed", String(otro.dataset[grupo.atributo] === elegido));
                }

                for (const ficha of document.querySelectorAll(`.plan[${grupo.ficha}]`)) {
                    ficha.classList.toggle("esta-elegido", ficha.getAttribute(grupo.ficha) === elegido);
                }

                marcarEnElFormulario(grupo.ficha === "data-nivel" ? "nivel" : "plan", elegido);

                if (elegido) {
                    document.querySelector(`.plan[${grupo.ficha}="${elegido}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            });
        }
    }
}

/* La lista del formulario sigue a lo que el visitante eligió arriba */
function marcarEnElFormulario(campo, elegido) {
    const lista = document.querySelector(`select[name="${campo}"]`);
    if (!lista) return;

    const opcion = [...lista.options].find((o) => o.dataset[campo] === elegido);
    lista.value = opcion ? opcion.value : "";
}

/* Los botones de cada ficha bajan al formulario con su plan o nivel ya elegido */
function iniciarSaltoAlFormulario() {
    for (const boton of document.querySelectorAll("[data-lleva-al-plan]")) {
        boton.addEventListener("click", () => marcarEnElFormulario("plan", boton.dataset.llevaAlPlan));
    }

    for (const boton of document.querySelectorAll("[data-lleva-al-nivel]")) {
        boton.addEventListener("click", () => marcarEnElFormulario("nivel", boton.dataset.llevaAlNivel));
    }

    for (const boton of document.querySelectorAll("[data-lleva-al-tramo]")) {
        boton.addEventListener("click", () => marcarEnElFormulario("alumnos", boton.dataset.llevaAlTramo));
    }
}

/* ---------- Lo que entra al llegar ---------- */

let observador = null;

function revelar() {
    const pendientes = [...document.querySelectorAll("[data-revelar]:not(.esta-visible)")].filter((e) => e.offsetParent !== null);

    if (!observador) {
        pendientes.forEach((e) => e.classList.add("esta-visible"));
        return;
    }

    pendientes.forEach((e) => observador.observe(e));
}

function iniciarRevelado() {
    const quietud = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!quietud.matches && "IntersectionObserver" in window) {
        observador = new IntersectionObserver(
            (entradas) => {
                for (const entrada of entradas) {
                    if (!entrada.isIntersecting) continue;
                    entrada.target.classList.add("esta-visible");
                    observador.unobserve(entrada.target);
                }
            },
            { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
        );
    }

    revelar();
}

iniciarSitio();
iniciarRevelado();
iniciarSelector();
iniciarNecesidades();
document.querySelectorAll("[data-formulario-contacto]").forEach(iniciarFormularioContacto);
iniciarSaltoAlFormulario();
