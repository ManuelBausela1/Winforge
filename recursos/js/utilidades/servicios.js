/* ==========================================================================
   UTILIDADES — SERVICIOS
   Un único lugar con los cuatro servicios. Lo usan las tarjetas del inicio
   y el formulario de contacto, para que la elección viaje de una página a
   la otra sin que los nombres se desincronicen.
   ========================================================================== */

export const SERVICIOS = [
    { slug: "diseno-y-estrategia", nombre: "Diseño y estrategia" },
    { slug: "desarrollo-de-software", nombre: "Desarrollo de software" },
    { slug: "gestion-multimedia", nombre: "Gestión multimedia" },
    { slug: "produccion-audiovisual", nombre: "Producción audiovisual" },
];

const CLAVE_ALMACEN = "winforge:servicios";
const PARAMETRO = "servicios";

/** Convierte "Diseño y estrategia" en "diseno-y-estrategia". */
export function aSlug(nombre) {
    return nombre
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Fuera los acentos
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

export function nombreDeSlug(slug) {
    return SERVICIOS.find((servicio) => servicio.slug === slug)?.nombre ?? null;
}

/** Deja la elección a mano para la página de contacto. */
export function guardarEleccion(slugs) {
    try {
        if (slugs.length) sessionStorage.setItem(CLAVE_ALMACEN, slugs.join(","));
        else sessionStorage.removeItem(CLAVE_ALMACEN);
    } catch {
        // Sin sessionStorage (navegación privada) la elección viaja igual en la URL
    }
}

/**
 * Lee la elección: primero la URL (así el enlace se puede compartir) y,
 * si no viene nada, lo guardado al tocar "Iniciar proyecto".
 */
export function leerEleccion() {
    const deLaUrl = new URLSearchParams(location.search).get(PARAMETRO);
    let crudo = deLaUrl;

    if (!crudo) {
        try {
            crudo = sessionStorage.getItem(CLAVE_ALMACEN);
        } catch {
            crudo = null;
        }
    }

    if (!crudo) return [];

    return crudo
        .split(",")
        .map((slug) => slug.trim())
        .filter((slug) => SERVICIOS.some((servicio) => servicio.slug === slug));
}

/** Agrega ?servicios=... a un enlace, conservando lo que ya tenga. */
export function conServiciosEnElEnlace(enlace, slugs) {
    const url = new URL(enlace.getAttribute("href"), location.href);

    if (slugs.length) url.searchParams.set(PARAMETRO, slugs.join(","));
    else url.searchParams.delete(PARAMETRO);

    return url.pathname + url.search + url.hash;
}
