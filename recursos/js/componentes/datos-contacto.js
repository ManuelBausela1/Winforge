const BANDA_DERECHA = 0.619;
const BANDA_CENTRO = 0.218;
const SEPARACION = 44;
const AIRE_CON_EL_FORMULARIO = 24;
const ANCHO_MINIMO = 1101;

export function iniciarDatosDeContacto(seccion = document.querySelector("[data-contacto]")) {
    if (!seccion) return;

    const contenedor = seccion.querySelector(".contacto__contenedor");
    const columna = seccion.querySelector(".contacto__columna-figura");
    const figura = seccion.querySelector("[data-figura]");
    const formulario = seccion.querySelector(".contacto__columna-formulario");
    const datos = seccion.querySelector("[data-datos]");

    if (!contenedor || !columna || !figura || !datos || !formulario) return;

    const pantallaAncha = window.matchMedia(`(min-width: ${ANCHO_MINIMO}px)`);

    function ubicar() {
        if (!pantallaAncha.matches) {
            seccion.style.removeProperty("--datos-x");
            seccion.style.removeProperty("--datos-y");
            return;
        }

        const base = contenedor.getBoundingClientRect();
        const marco = columna.getBoundingClientRect();

        const izquierda = marco.left - base.left + figura.offsetLeft;
        const arriba = marco.top - base.top + figura.offsetTop;

        /* La imagen se ajusta con object-fit: contain, asi que el dibujo puede
           ser mas chico que su caja: hay que medir el dibujo, no la caja. */
        const razon = (figura.naturalWidth || 1000) / (figura.naturalHeight || 1355);
        let anchoDibujo = figura.offsetWidth;
        let altoDibujo = anchoDibujo / razon;

        if (altoDibujo > figura.offsetHeight) {
            altoDibujo = figura.offsetHeight;
            anchoDibujo = altoDibujo * razon;
        }

        const dibujoX = izquierda + (figura.offsetWidth - anchoDibujo) / 2;
        const dibujoY = arriba + (figura.offsetHeight - altoDibujo) / 2;

        const alLadoDeLosOjos = dibujoX + anchoDibujo * BANDA_DERECHA + SEPARACION;
        const limite = formulario.getBoundingClientRect().left - base.left - datos.offsetWidth - AIRE_CON_EL_FORMULARIO;

        seccion.style.setProperty("--datos-x", `${Math.round(Math.max(0, Math.min(alLadoDeLosOjos, limite)))}px`);
        seccion.style.setProperty("--datos-y", `${Math.round(dibujoY + altoDibujo * BANDA_CENTRO)}px`);
    }

    window.addEventListener("resize", ubicar, { passive: true });
    pantallaAncha.addEventListener("change", ubicar);

    if (!figura.complete) figura.addEventListener("load", ubicar, { once: true });
    if (document.fonts?.ready) document.fonts.ready.then(ubicar);

    ubicar();
}
