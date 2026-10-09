/**
 * Las cartas de servicios que se apilan con el scroll.
 * El CSS hace el trabajo con position: sticky; acá sólo medimos: cada carta
 * se frena acumulando el alto real de las solapas anteriores, y la cola del
 * final se calcula para que la última termine de subir sin que el borde del
 * contenedor empuje a las de arriba y les tape la solapa.
 */

import { prefiereMovimientoReducido } from "../utilidades/movimiento.js";

export function iniciarCartasApiladas(raiz = document.querySelector("[data-cartas-apiladas]")) {
    if (!raiz) return;

    const cartas = [...raiz.querySelectorAll("[data-carta]")];
    const cola = raiz.querySelector("[data-cola]");
    if (cartas.length < 2) return;

    /* getComputedStyle devuelve el token tal cual ("clamp(...)"), no el valor
       resuelto, así que la medida la toma un testigo con ese alto. */
    function enPixeles(expresion) {
        const testigo = document.createElement("div");
        testigo.setAttribute("aria-hidden", "true");
        testigo.style.cssText = `position:absolute;visibility:hidden;width:0;height:${expresion}`;
        raiz.append(testigo);

        const alto = testigo.getBoundingClientRect().height;
        testigo.remove();

        return alto;
    }

    function medir() {
        const rotulo = raiz.closest(".apilado-marco")?.querySelector("[data-rotulo]");

        function limpiar() {
            raiz.style.removeProperty("--alto-cola");
            raiz.style.removeProperty("margin-top");
            rotulo?.style.removeProperty("padding-bottom");
            cartas.forEach((carta) => {
                carta.style.removeProperty("top");
                carta.style.removeProperty("padding-bottom");
            });
        }

        /* Con movimiento reducido la hoja ya las deja una abajo de la otra */
        if (prefiereMovimientoReducido()) {
            limpiar();
            return;
        }

        const aire = enPixeles("var(--aire-solapa)");

        /* El rótulo de la sección también queda fijo arriba: las cartas
           arrancan justo debajo de su banda. */
        rotulo?.style.removeProperty("padding-bottom");

        const topeRotulo = rotulo ? enPixeles("var(--tope-encabezado)") : 0;
        const altoRotulo = rotulo?.offsetHeight ?? 0;
        const tope = rotulo ? topeRotulo + altoRotulo + aire : enPixeles("var(--tope-apilado)");

        /* Se mide sin apilar y sin relleno: así los altos son los reales */
        raiz.classList.add("esta-desapilado");

        const solapas = cartas.map((carta) => carta.querySelector("[data-solapa]")?.offsetHeight ?? 0);
        const papeles = cartas.map((carta) => carta.querySelector(".apilado__papel")?.offsetHeight ?? carta.offsetHeight);

        const topes = [];
        let acumulado = tope;

        for (let i = 0; i < cartas.length; i += 1) {
            topes.push(acumulado);
            acumulado += solapas[i] + aire;
        }

        const ultima = cartas.length - 1;
        const altoPila = topes[ultima] + papeles[ultima];

        /* Si la pila completa no entra en la pantalla con algo de aire abajo,
           se leen en vertical */
        if (altoPila > window.innerHeight - 48) {
            limpiar();
            return;
        }

        raiz.classList.remove("esta-desapilado");

        /* Todas las cajas terminan a la misma altura: el relleno de abajo es
           transparente, así que sólo sirve para que salgan juntas. */
        const fondo = Math.max(...topes.map((t, i) => t + papeles[i]));

        cartas.forEach((carta, i) => {
            carta.style.setProperty("top", topes[i] + "px");
            carta.style.setProperty("padding-bottom", Math.round(fondo - (topes[i] + papeles[i])) + "px");
        });

        /* El rótulo lleva un relleno parecido: si no, por ser el más bajo se
           quedaría clavado arriba un buen rato después de irse las cartas.
           Ese relleno no debe abrir un hueco, así que la pila sube otro tanto
           y la primera carta queda pegada al rótulo desde el arranque. */
        if (rotulo) {
            const relleno = Math.round(Math.max(0, fondo - topeRotulo - altoRotulo));
            rotulo.style.setProperty("padding-bottom", relleno + "px");
            raiz.style.setProperty("margin-top", -relleno + "px");
        }

        /* Lo que la pila se queda quieta antes de que el final del contenedor
           empiece a empujarla hacia arriba. */
        raiz.style.setProperty("--alto-cola", Math.round(Math.min(window.innerHeight * 0.35, 320)) + "px");
    }

    medir();

    /* Al cambiar el ancho los textos se reacomodan y los altos cambian */
    if ("ResizeObserver" in window) {
        let primera = true;
        const observador = new ResizeObserver(() => {
            if (primera) {
                primera = false;
                return;
            }
            medir();
        });

        observador.observe(document.documentElement);
    } else {
        window.addEventListener("resize", medir);
    }

    /* Las fuentes entran después y mueven los altos */
    document.fonts?.ready.then(medir);

    window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener?.("change", medir);
}
