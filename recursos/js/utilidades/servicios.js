export const SERVICIOS = [
    { slug: "diseno-y-estrategia", nombre: "Diseño y estrategia" },
    { slug: "desarrollo-de-software", nombre: "Desarrollo de software" },
    { slug: "gestion-multimedia", nombre: "Gestión multimedia" },
    { slug: "produccion-audiovisual", nombre: "Producción audiovisual" },
];

const CLAVE_ALMACEN = "winforge:servicios";
const PARAMETRO = "servicios";

export function aSlug(nombre) {
    return nombre
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

export function nombreDeSlug(slug) {
    return SERVICIOS.find((servicio) => servicio.slug === slug)?.nombre ?? null;
}

export function guardarEleccion(slugs) {
    try {
        if (slugs.length) sessionStorage.setItem(CLAVE_ALMACEN, slugs.join(","));
        else sessionStorage.removeItem(CLAVE_ALMACEN);
    } catch {

    }
}

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

export function conServiciosEnElEnlace(enlace, slugs) {
    const url = new URL(enlace.getAttribute("href"), location.href);

    if (slugs.length) url.searchParams.set(PARAMETRO, slugs.join(","));
    else url.searchParams.delete(PARAMETRO);

    return url.pathname + url.search + url.hash;
}
