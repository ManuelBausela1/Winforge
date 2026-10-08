/* Los servicios que el formulario de contacto puede recibir en el enlace
   (contacto/?servicios=web-y-campanas). */
const SERVICIOS = [
    { slug: "estrategia-y-marca", nombre: "Estrategia y marca" },
    { slug: "contenido-y-produccion", nombre: "Contenido y producción" },
    { slug: "web-y-campanas", nombre: "Web y campañas" },
];

const CLAVE_ALMACEN = "winforge:servicios";
const PARAMETRO = "servicios";

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
