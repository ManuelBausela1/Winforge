import { leerEleccion } from "../utilidades/servicios.js";
import {
    cuantosEnlaces,
    escrituraAjena,
    esEmailRazonable,
    esNombreRazonable,
    limpiarTexto,
    pareceRelleno,
    tieneMarcado,
} from "../utilidades/seguridad.js";

const LIMITES = {
    esperaEntreEnvios: 45000,
    maximoPorHora: 3,
    maximoPorDia: 6,
    ventana: 3600000,
    ventanaLarga: 86400000,
    tiempoMinimoDeCarga: 3000,
    largoNombre: 80,
    largoEmail: 120,
    largoMensaje: 1200,
    enlacesPermitidos: 1,
};

/* Solo aceptamos los valores que pusimos nosotros en el marcado. */
const SERVICIOS_VALIDOS = ["Estrategia y marca", "Contenido y producción", "Web y campañas"];
const TIPOS_VALIDOS = ["Marca", "Institución"];
const PLANES_VALIDOS = ["Presencia", "Crecimiento", "Gestión", "A medida", "Todavía no sé"];
const NIVELES_VALIDOS = ["Presencia escolar", "Admisión", "Alumbra", "RayuelA", "Todavía no sé"];
const TRAMOS_VALIDOS = ["Hasta 300 alumnos", "301 a 600 alumnos", "601 a 1.000 alumnos", "Más de 1.000 alumnos", "Todavía no sé"];

/* Los campos que puede traer un formulario; cada página usa los que necesita */
const CAMPOS_POSIBLES = ["nombre", "tipo", "institucion", "cargo", "email", "plan", "nivel", "alumnos", "mensaje", "servicios"];

/* Cómo se nombra cada dato en el correo que se arma */
const ETIQUETAS = {
    nombre: "Nombre",
    tipo: "Marca o institución",
    institucion: "Institución",
    cargo: "Cargo",
    email: "Email",
    plan: "Plan",
    nivel: "Nivel",
    alumnos: "Cantidad de alumnos",
    servicios: "Servicios",
};

const CLAVE_ENVIOS = "winforge:envios";

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
        relleno: "Contanos con tus palabras qué necesitás.",
        enlaces: "Dejanos el proyecto en palabras: los enlaces los vemos después.",
        marcado: "Escribí el mensaje como texto, sin etiquetas ni código.",
    },
    idioma: "Escribinos en español o en inglés y te respondemos.",
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

    if (valor && escrituraAjena(valor)) return MENSAJES.idioma;

    switch (nombre) {
        case "nombre":
            if (!valor) return MENSAJES.nombre.vacio;
            if (valor.length < 3 || !valor.includes(" ")) return MENSAJES.nombre.corto;
            if (!esNombreRazonable(valor)) return MENSAJES.nombre.raro;
            return "";

        case "email":
            if (!valor) return MENSAJES.email.vacio;
            if (!esEmailRazonable(valor)) return MENSAJES.email.invalido;
            return "";

        case "mensaje":
            if (!valor) return MENSAJES.mensaje.vacio;
            if (valor.length < 10) return MENSAJES.mensaje.corto;
            if (tieneMarcado(valor)) return MENSAJES.mensaje.marcado;
            if (cuantosEnlaces(valor) > LIMITES.enlacesPermitidos) return MENSAJES.mensaje.enlaces;
            if (pareceRelleno(valor)) return MENSAJES.mensaje.relleno;
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
            if (tieneMarcado(valor) || cuantosEnlaces(valor)) return MENSAJES.institucion.corto;
            return "";

        case "cargo":
            if (!valor) return MENSAJES.cargo.vacio;
            if (valor.length < 3) return MENSAJES.cargo.corto;
            if (tieneMarcado(valor) || cuantosEnlaces(valor)) return MENSAJES.cargo.corto;
            return "";

        case "servicios":
            return serviciosElegidos(formulario).length ? "" : MENSAJES.servicios.vacio;

        default:
            return "";
    }
}

function leerEnvios() {
    try {
        const guardado = JSON.parse(localStorage.getItem(CLAVE_ENVIOS) ?? "[]");
        return Array.isArray(guardado) ? guardado.filter((marca) => Number.isFinite(marca)) : [];
    } catch {
        return [];
    }
}

function anotarEnvio() {
    try {
        const ahora = Date.now();
        const recientes = leerEnvios().filter((marca) => ahora - marca < LIMITES.ventanaLarga);
        recientes.push(ahora);
        localStorage.setItem(CLAVE_ENVIOS, JSON.stringify(recientes));
    } catch {

    }
}

function revisarFreno(nacimientoDelFormulario) {
    const ahora = Date.now();

    if (ahora - nacimientoDelFormulario < LIMITES.tiempoMinimoDeCarga) {
        return "Tomate un segundo más para revisar lo que escribiste.";
    }

    const delDia = leerEnvios().filter((marca) => ahora - marca < LIMITES.ventanaLarga);
    const recientes = delDia.filter((marca) => ahora - marca < LIMITES.ventana);
    const ultimo = delDia[delDia.length - 1];

    if (ultimo && ahora - ultimo < LIMITES.esperaEntreEnvios) {
        const faltan = Math.ceil((LIMITES.esperaEntreEnvios - (ahora - ultimo)) / 1000);
        return `Ya recibimos tu mensaje. Esperá ${faltan} segundos antes de enviar otro.`;
    }

    if (recientes.length >= LIMITES.maximoPorHora) {
        return "Recibimos varios mensajes tuyos en la última hora. Te respondemos a la brevedad.";
    }

    if (delDia.length >= LIMITES.maximoPorDia) {
        return "Ya nos escribiste varias veces hoy. Si es urgente, llamanos o escribinos por WhatsApp.";
    }

    return "";
}

async function enviar(formulario, datos) {
    const destino = formulario.dataset.endpoint;

    if (destino) {
        const respuesta = await fetch(destino, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(datos),
        });

        if (!respuesta.ok) throw new Error(`El servidor respondió ${respuesta.status}`);
        return "enviado";
    }

    const cuerpo = [
        ...Object.entries(ETIQUETAS)
            .filter(([clave]) => clave in datos)
            .map(([clave, etiqueta]) => {
                const valor = datos[clave];
                return `${etiqueta}: ${Array.isArray(valor) ? valor.join(", ") : valor}`;
            }),
        "",
        datos.mensaje,
    ].join("\n");

    /* El asunto va en una sola línea: un salto acá deja meter cabeceras. */
    const asunto = `${formulario.dataset.asunto ?? "Nuevo proyecto"}: ${datos.nombre}`.replace(/\s+/g, " ").slice(0, 120);

    window.location.href = `mailto:info@winforge.com?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;

    return "correo";
}

export function iniciarFormularioContacto(formulario = document.querySelector("[data-formulario-contacto]")) {
    if (!formulario) return;

    const aviso = formulario.querySelector("[data-aviso]");
    const boton = formulario.querySelector('button[type="submit"]');
    const nacimiento = Date.now();
    const campos = CAMPOS_POSIBLES.filter((nombre) => formulario.elements[nombre]);
    const revisados = new Set();
    let enviando = false;

    function controlesDe(nombre) {
        const control = formulario.elements[nombre];
        if (!control) return [];
        return typeof control.length === "number" && !(control instanceof HTMLElement) ? [...control] : [control];
    }

    function mostrarError(nombre, texto) {
        const cartel = formulario.querySelector(`[data-error="${nombre}"]`);
        if (cartel) cartel.textContent = texto;

        controlesDe(nombre).forEach((elemento) => {
            if (elemento.type === "checkbox" || elemento.type === "radio") return;
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

        /* La trampa: si el campo escondido viene lleno, es un bot. */
        if (formulario.elements.empresa?.value) {
            aviso.textContent = "¡Gracias! Te escribimos a la brevedad.";
            return;
        }

        campos.forEach((nombre) => revisados.add(nombre));
        const valido = campos.map((nombre) => revisar(nombre, { forzar: true })).every(Boolean);

        if (!valido) {
            aviso.dataset.estado = "error";
            aviso.textContent = "Revisá los campos marcados.";
            formulario.querySelector(".formulario__campo.tiene-error input, .formulario__campo.tiene-error textarea")?.focus();
            return;
        }

        const freno = revisarFreno(nacimiento);
        if (freno) {
            aviso.dataset.estado = "espera";
            aviso.textContent = freno;
            return;
        }

        const datos = Object.fromEntries(
            campos.map((nombre) => [nombre, nombre === "servicios" ? serviciosElegidos(formulario) : valorLimpio(formulario, nombre)]),
        );

        enviando = true;
        boton.disabled = true;
        aviso.dataset.estado = "enviando";
        aviso.textContent = "Enviando…";

        try {
            const resultado = await enviar(formulario, datos);
            anotarEnvio();

            aviso.dataset.estado = "listo";
            aviso.textContent =
                resultado === "correo"
                    ? "Abrimos tu correo con el mensaje listo para enviar."
                    : "¡Gracias! Recibimos tu mensaje y te respondemos a la brevedad.";

            if (resultado !== "correo") formulario.reset();
        } catch (error) {
            console.warn("No se pudo enviar el formulario.", error);
            aviso.dataset.estado = "error";
            aviso.textContent = "No pudimos enviarlo. Probá de nuevo o escribinos a info@winforge.com.";
        } finally {
            enviando = false;
            boton.disabled = false;
        }
    });
}
