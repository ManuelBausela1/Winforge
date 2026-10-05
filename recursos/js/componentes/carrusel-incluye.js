/**
 * Carrusel de "Qué incluye": una lámina por punto del servicio, con índice,
 * flechas, teclado y deslizamiento táctil.
 */
const DISTANCIA_MINIMA = 45;

export function iniciarCarruselIncluye(carrusel = document.querySelector("[data-carrusel-incluye]")) {
    if (!carrusel) return;

    const riel = carrusel.querySelector("[data-riel]");
    const visor = carrusel.querySelector("[data-visor]");
    const laminas = [...carrusel.querySelectorAll("[data-lamina]")];
    const botones = [...carrusel.querySelectorAll("[data-ir-a]")];
    const anterior = carrusel.querySelector("[data-anterior]");
    const siguiente = carrusel.querySelector("[data-siguiente]");
    const aviso = carrusel.querySelector("[data-aviso-carrusel]");

    if (!riel || !laminas.length) return;

    let activa = 0;
    let toque = null;

    function mostrar(indice, { avisar = true } = {}) {
        const destino = Math.max(0, Math.min(laminas.length - 1, indice));
        const cambia = destino !== activa;

        activa = destino;
        riel.style.transform = `translateX(-${activa * 100}%)`;

        laminas.forEach((lamina, i) => {
            const elegida = i === activa;

            lamina.inert = !elegida;
            lamina.setAttribute("aria-hidden", String(!elegida));
            botones[i]?.setAttribute("aria-pressed", String(elegida));
        });

        if (anterior) anterior.disabled = activa === 0;
        if (siguiente) siguiente.disabled = activa === laminas.length - 1;

        if (aviso && avisar && cambia) {
            aviso.textContent = `Punto ${activa + 1} de ${laminas.length}: ${botones[activa]?.getAttribute("aria-label") ?? ""}`;
        }
    }

    botones.forEach((boton, indice) => {
        boton.addEventListener("click", () => mostrar(indice));
    });

    anterior?.addEventListener("click", () => mostrar(activa - 1));
    siguiente?.addEventListener("click", () => mostrar(activa + 1));

    carrusel.querySelector("[data-navegacion-carrusel]")?.addEventListener("keydown", (evento) => {
        if (evento.altKey || evento.ctrlKey || evento.metaKey) return;

        let destino;

        if (evento.key === "ArrowRight") destino = activa + 1;
        if (evento.key === "ArrowLeft") destino = activa - 1;
        if (evento.key === "Home") destino = 0;
        if (evento.key === "End") destino = laminas.length - 1;

        if (destino === undefined) return;

        evento.preventDefault();
        mostrar(destino);
        botones[activa]?.focus();
    });

    /* El deslizamiento no debe pelear con el scroll vertical. */
    visor?.addEventListener("pointerdown", (evento) => {
        if (evento.pointerType !== "touch") return;

        toque = { id: evento.pointerId, x: evento.clientX, y: evento.clientY };
        visor.setPointerCapture(evento.pointerId);
    });

    visor?.addEventListener("pointerup", (evento) => {
        if (!toque || evento.pointerId !== toque.id) return;

        const avanceX = evento.clientX - toque.x;
        const avanceY = evento.clientY - toque.y;

        toque = null;

        if (Math.abs(avanceX) > DISTANCIA_MINIMA && Math.abs(avanceX) > Math.abs(avanceY)) {
            mostrar(activa + (avanceX < 0 ? 1 : -1));
        }
    });

    visor?.addEventListener("pointercancel", () => {
        toque = null;
    });

    mostrar(0, { avisar: false });
}
