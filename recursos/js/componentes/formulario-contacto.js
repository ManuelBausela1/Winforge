import { leerEleccion } from "../utilidades/servicios.js";
import {
    esEmailRazonable,
    esNombreRazonable,
    limpiarTexto,
} from "../utilidades/seguridad.js";

const LIMITES = {
    largoNombre: 80,
    largoEmail: 120,
    largoMensaje: 1200,
};

/* Solo aceptamos los valores que pusimos nosotros en el marcado. */
const SERVICIOS_VALIDOS = ["Estrategia y marca", "Contenido y producción", "Web y campañas"];
const TIPOS_VALIDOS = ["Marca", "Institución"];
const PLANES_VALIDOS = ["Presencia", "Crecimiento", "Gestión", "A medida", "Todavía no sé"];
const NIVELES_VALIDOS = ["Presencia escolar", "Admisión", "Alumbra", "Rayuela", "Todavía no sé"];
const TRAMOS_VALIDOS = ["Hasta 300 alumnos", "301 a 600 alumnos", "601 a 1.000 alumnos", "Más de 1.000 alumnos", "Todavía no sé"];

/* Los campos que puede traer un formulario; cada página usa los que necesita */
const CAMPOS_POSIBLES = ["nombre", "tipo", "institucion", "cargo", "email", "plan", "nivel", "alumnos", "mensaje", "servicios"];

const MENSAJES = {
    nombre: {
        vacio: "Contanos cómo te llamás.",
        corto: "Escribí tu nombre y apellido.",
        raro: "Usá solo letras para el nombre.",
    },
    email: {
        vacio: "Necesitamos un email para responderte.",
        invalido: "Revisá el email: parece que falta algo.",
    },
    tipo: {
        vacio: "Contanos si nos escribís como marca o institución.",
    },
    servicios: {
        vacio: "Elegí al menos un servicio.",
    },
    plan: {
        vacio: "Elegí el plan que te interesa.",
    },
    nivel: {
        vacio: "Elegí el nivel que les interesa.",
    },
    alumnos: {
        vacio: "Elegí el tramo de alumnos del colegio.",
    },
    institucion: {
        vacio: "Contanos de qué institución nos escribís.",
        corto: "Escribí el nombre completo de la institución.",
    },
    cargo: {
        vacio: "Contanos qué cargo ocupás.",
        corto: "Escribí el cargo con un poco más de detalle.",
    },
    mensaje: {
        vacio: "Contanos sobre tu proyecto.",
        corto: "Un par de líneas más y podemos entenderlo mejor.",
    },
};

function serviciosElegidos(formulario) {
    return [...formulario.querySelectorAll('input[name="servicios"]:checked')]
        .map((casilla) => casilla.value)
        .filter((valor) => SERVICIOS_VALIDOS.includes(valor));
}

/* El valor ya limpio de cada campo: validamos y enviamos siempre esto. */
function valorLimpio(formulario, nombre) {
    const control = formulario.elements[nombre];
    const crudo = typeof control?.value === "string" ? control.value : "";

    if (nombre === "mensaje") return limpiarTexto(crudo, { maximo: LIMITES.largoMensaje, conSaltos: true });
    if (nombre === "email") return limpiarTexto(crudo, { maximo: LIMITES.largoEmail }).toLowerCase();
    if (nombre === "nombre" || nombre === "cargo") return limpiarTexto(crudo, { maximo: LIMITES.largoNombre });
    if (nombre === "institucion") return limpiarTexto(crudo, { maximo: 120 });

    return limpiarTexto(crudo, { maximo: 60 });
}

function validarCampo(formulario, nombre) {
    const valor = valorLimpio(formulario, nombre);

    switch (nombre) {
        case "nombre":
            if (!valor) return MENSAJES.nombre.vacio;
            if (valor.length < 3) return MENSAJES.nombre.corto;
            if (!esNombreRazonable(valor)) return MENSAJES.nombre.raro;
            return "";

        case "email":
            if (!valor) return MENSAJES.email.vacio;
            if (!esEmailRazonable(valor)) return MENSAJES.email.invalido;
            return "";

        case "mensaje":
            if (!valor) return MENSAJES.mensaje.vacio;
            if (valor.length < 10) return MENSAJES.mensaje.corto;
            return "";

        case "tipo":
            return TIPOS_VALIDOS.includes(valor) ? "" : MENSAJES.tipo.vacio;

        case "plan":
            return PLANES_VALIDOS.includes(valor) ? "" : MENSAJES.plan.vacio;

        case "nivel":
            return NIVELES_VALIDOS.includes(valor) ? "" : MENSAJES.nivel.vacio;

        case "alumnos":
            return TRAMOS_VALIDOS.includes(valor) ? "" : MENSAJES.alumnos.vacio;

        case "institucion":
            if (!valor) return MENSAJES.institucion.vacio;
            if (valor.length < 3) return MENSAJES.institucion.corto;
            return "";

        case "cargo":
            if (!valor) return MENSAJES.cargo.vacio;
            if (valor.length < 3) return MENSAJES.cargo.corto;
            return "";

        case "servicios":
            return serviciosElegidos(formulario).length ? "" : MENSAJES.servicios.vacio;

        default:
            return "";
    }
}

/* El mismo identificador se conserva al reintentar exactamente el mismo texto. */
async function enviar(formulario, datos, solicitud) {
    const controlador = new AbortController();
    const reloj = setTimeout(() => controlador.abort(), 30000);
    try {
        const respuesta = await fetch(formulario.dataset.endpoint, {
            method: "POST",
            mode: "same-origin",
            credentials: "omit",
            cache: "no-store",
            redirect: "error",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "X-Winforge-Formulario": "1",
            },
            body: JSON.stringify({ ...datos, solicitud }),
            signal: controlador.signal,
        });
        let resultado;
        try {
            resultado = await respuesta.json();
        } catch {
            throw new Error("El envío no está disponible por el momento. Conservamos tu texto; podés escribirnos a info@winforge.com.");
        }
        if (!respuesta.ok || resultado?.success !== true) {
            const error = new Error(typeof resultado?.message === "string" ? resultado.message : "No pudimos enviar la consulta. Intentá más tarde.");
            error.campos = resultado?.errors;
            error.espera = Math.min(86400, Math.max(0, Number(resultado?.retryAfter) || 0));
            throw error;
        }
        return resultado;
    } catch (error) {
        if (error.name === "AbortError" || error instanceof TypeError) {
            throw new Error("No pudimos confirmar el envío. Tu texto sigue en pantalla. Revisá la conexión; si reintentás sin cambiarlo, evitamos enviar la consulta dos veces.");
        }
        throw error;
    } finally {
        clearTimeout(reloj);
    }
}

export function iniciarFormularioContacto(formulario = document.querySelector("[data-formulario-contacto]")) {
    if (!formulario) return;

    // Retiramos el contador local anterior; ahora el control lo hace el servidor.
    try { localStorage.removeItem("winforge:envios"); } catch { /* Puede estar bloqueado. */ }

    const aviso = formulario.querySelector("[data-aviso]");
    const boton = formulario.querySelector('button[type="submit"]');
    const campos = CAMPOS_POSIBLES.filter((nombre) => formulario.elements[nombre]);
    const revisados = new Set();
    let enviando = false;
    let ultimoContenido = "";
    let solicitud = "";
    let esperarHasta = 0;
    boton.disabled = false;

    function controlesDe(nombre) {
        const control = formulario.elements[nombre];
        if (!control) return [];
        return typeof control.length === "number" && !(control instanceof HTMLElement) ? [...control] : [control];
    }

    function mostrarError(nombre, texto) {
        const cartel = formulario.querySelector(`[data-error="${nombre}"]`);
        if (cartel) cartel.textContent = texto;

        controlesDe(nombre).forEach((elemento) => {
            elemento.setAttribute("aria-invalid", texto ? "true" : "false");
        });

        cartel?.closest(".formulario__campo")?.classList.toggle("tiene-error", Boolean(texto));
    }

    function revisar(nombre, { forzar = false } = {}) {
        if (!forzar && !revisados.has(nombre)) return true;

        const error = validarCampo(formulario, nombre);
        mostrarError(nombre, error);
        return !error;
    }

    const elegidos = leerEleccion();
    if (elegidos.length) {
        formulario.querySelectorAll('input[name="servicios"]').forEach((casilla) => {
            casilla.checked = elegidos.includes(casilla.dataset.slug);
        });
    }

    campos.forEach((nombre) => {
        controlesDe(nombre).forEach((elemento) => {
            elemento.addEventListener("blur", () => {
                revisados.add(nombre);

                /* Al salir del campo guardamos el texto ya limpio. */
                if (typeof elemento.value === "string" && elemento.type !== "checkbox" && elemento.type !== "radio") {
                    elemento.value = valorLimpio(formulario, nombre);
                }

                revisar(nombre);
            });

            elemento.addEventListener(elemento.type === "checkbox" || elemento.type === "radio" ? "change" : "input", () => {
                if (elemento.type === "checkbox" || elemento.type === "radio") revisados.add(nombre);
                revisar(nombre);
            });
        });
    });

    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        if (enviando) return;

        if (Date.now() < esperarHasta) {
            aviso.dataset.estado = "espera";
            aviso.textContent = `Esperá ${Math.ceil((esperarHasta - Date.now()) / 1000)} segundos antes de volver a enviar.`;
            return;
        }

        campos.forEach((nombre) => revisados.add(nombre));
        const valido = campos.map((nombre) => revisar(nombre, { forzar: true })).every(Boolean);

        if (!valido) {
            aviso.dataset.estado = "error";
            aviso.textContent = "Revisá los campos marcados.";
            formulario.querySelector('[aria-invalid="true"]')?.focus();
            return;
        }

        const datos = Object.fromEntries(
            campos.map((nombre) => [nombre, nombre === "servicios" ? serviciosElegidos(formulario) : valorLimpio(formulario, nombre)]),
        );

        datos.formulario = formulario.dataset.formulario;
        datos.empresa = formulario.elements.empresa?.value ?? "";
        const contenido = JSON.stringify(datos);
        if (!crypto.randomUUID) {
            aviso.dataset.estado = "error";
            aviso.textContent = "Abrí el sitio con HTTPS o escribinos a info@winforge.com.";
            return;
        }
        if (contenido !== ultimoContenido) {
            solicitud = crypto.randomUUID();
            ultimoContenido = contenido;
        }
        const controles = [...formulario.elements].map((elemento) => [elemento, elemento.disabled]);
        controles.forEach(([elemento]) => { elemento.disabled = true; });
        enviando = true;
        formulario.setAttribute("aria-busy", "true");
        const etiquetaBoton = boton.querySelector(".boton__texto");
        const textoBoton = etiquetaBoton?.textContent;
        if (etiquetaBoton) etiquetaBoton.textContent = "Enviando…";
        aviso.dataset.estado = "enviando";
        aviso.textContent = "Enviando tu consulta…";

        try {
            const resultado = await enviar(formulario, datos, solicitud);
            aviso.dataset.estado = "listo";
            aviso.textContent = resultado.message;
            formulario.reset();
            revisados.clear();
            campos.forEach((campo) => mostrarError(campo, ""));
            ultimoContenido = "";
            solicitud = "";
        } catch (error) {
            aviso.dataset.estado = error.espera ? "espera" : "error";
            aviso.textContent = error.message;
            esperarHasta = Date.now() + (error.espera || 0) * 1000;
            if (error.campos && typeof error.campos === "object") {
                campos.forEach((campo) => {
                    if (typeof error.campos[campo] === "string") mostrarError(campo, error.campos[campo]);
                });
            }
        } finally {
            controles.forEach(([elemento, deshabilitado]) => { elemento.disabled = deshabilitado; });
            enviando = false;
            formulario.removeAttribute("aria-busy");
            if (etiquetaBoton) etiquetaBoton.textContent = textoBoton;
            formulario.querySelector('[aria-invalid="true"]')?.focus();
        }
    });
}
