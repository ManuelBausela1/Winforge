/**
 * El pie manda mientras está a la vista: la navegación del costado se aparta
 * y la palabra de la marca sube desde el borde de abajo.
 */
export function iniciarPie(pie = document.querySelector("[data-pie]")) {
    if (!pie || !("IntersectionObserver" in window)) return;

    const navegacion = document.querySelector("[data-navegacion-indice]");

    const observador = new IntersectionObserver(
        ([entrada]) => {
            const estaALaVista = entrada.isIntersecting;

            pie.classList.toggle("esta-a-la-vista", estaALaVista);
            navegacion?.classList.toggle("esta-oculta", estaALaVista);
        },
        { threshold: 0.2 },
    );

    observador.observe(pie);
}
