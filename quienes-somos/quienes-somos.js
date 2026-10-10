import { iniciarSitio } from "../recursos/js/principal.js";
import { iniciarPilaresEntrada } from "../recursos/js/componentes/pilares-entrada.js";

function iniciarEquipo() {
    const pantallaCompacta = window.matchMedia("(max-width: 1100px)");

    document.querySelectorAll(".equipo__tarjeta").forEach((tarjeta, indice) => {
        const datos = tarjeta.querySelector(".equipo__datos");
        const nombre = tarjeta.querySelector(".equipo__nombre")?.textContent.trim();
        if (!datos || !nombre) return;

        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "equipo__alternar";
        datos.id ||= `equipo-datos-${indice + 1}`;
        boton.setAttribute("aria-controls", datos.id);

        function mostrar(visible) {
            tarjeta.classList.toggle("muestra-datos", visible);
            boton.setAttribute("aria-expanded", String(visible));
            boton.setAttribute("aria-label", `${visible ? "Ocultar" : "Mostrar"} información de ${nombre}`);
            if (pantallaCompacta.matches) datos.setAttribute("aria-hidden", String(!visible));
            else datos.removeAttribute("aria-hidden");
        }

        boton.addEventListener("click", () => {
            if (!pantallaCompacta.matches) return;
            mostrar(!tarjeta.classList.contains("muestra-datos"));
        });
        pantallaCompacta.addEventListener("change", () => mostrar(false));

        tarjeta.append(boton);
        tarjeta.classList.add("con-interaccion");
        mostrar(false);
    });
}

iniciarSitio();
iniciarPilaresEntrada();
iniciarEquipo();
