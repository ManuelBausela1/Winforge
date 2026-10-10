/* Seis proyectos: tres filas en mobile y dos en tablet. */
export function iniciarCasosServicio() {
    const compacta = window.matchMedia("(max-width: 1100px)");
    document.querySelectorAll(".servicio-casos").forEach((seccion, indice) => {
        if (seccion.hasAttribute("data-casos-completos")) return;
        const lista = seccion.querySelector(".servicio-casos__lista");
        if (!lista || lista.children.length <= 6) return;
        const casos = [...lista.children];
        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "boton servicio-casos__mas";
        lista.id ||= `casos-servicio-${indice + 1}`;
        boton.setAttribute("aria-controls", lista.id);
        lista.after(boton);
        let abierto = false;

        function pintar() {
            casos.forEach((caso, posicion) => {
                caso.hidden = compacta.matches && !abierto && posicion >= 6;
            });
            boton.hidden = !compacta.matches;
            boton.textContent = abierto ? "Ver menos" : "Ver más";
            boton.setAttribute("aria-expanded", String(abierto));
        }

        boton.addEventListener("click", () => {
            abierto = !abierto;
            pintar();
            if (!abierto) boton.scrollIntoView({ block: "nearest" });
        });
        compacta.addEventListener("change", () => {
            abierto = false;
            pintar();
        });
        pintar();
    });
}
