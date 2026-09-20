/* ==========================================================================
   UTILIDADES — ANIMACIONES DE ENTRADA
   Corren solo en la primera visita a cada página. El script del <head> es
   el que decide y deja la marca en <html class="animar">; acá el resto del
   sitio la consulta.
   ========================================================================== */

/** ¿Esta visita lleva animaciones de entrada? */
export function hayAnimacionesDeEntrada() {
    return document.documentElement.classList.contains("animar");
}
