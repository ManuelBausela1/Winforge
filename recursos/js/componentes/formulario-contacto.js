/* ==========================================================================
   COMPONENTE — FORMULARIO DE CONTACTO
   Validación en vivo (todos los campos son obligatorios), freno de envíos
   para que nadie sature el buzón y precarga de los servicios que el
   visitante eligió en el inicio.

   Nota: el freno vive en el navegador, así que sirve contra el apuro y los
   robots simples, no contra un ataque decidido. El límite de verdad tiene
   que estar en el servidor que reciba el formulario.
   ========================================================================== */

import { leerEleccion } from "../utilidades/servicios.js";

const LIMITES = {
    esperaEntreEnvios: 45000, // ms entre un envío y el siguiente
    maximoPorHora: 3,
    ventana: 3600000, // ms de la ventana horaria
    tiempoMinimoDeCarga: 3000, // ms: menos que eso, es un robot
};

const CLAVE_ENVIOS = "winforge:envios";

const MENSAJES = {
    nombre: {
        vacio: "Contanos cómo te llamás.",
        corto: "Escribí tu nombre y apellido.",
    },
    email: {
        vacio: "Necesitamos un email para responderte.",
        invalido: "Revisá el email: parece que falta algo.",
    },
    servicios: {
        vacio: "Elegí al menos un servicio.",
    },
    mensaje: {
        vacio: "Contanos sobre tu proyecto.",
        corto: "Un par de líneas más y podemos entenderlo mejor.",
    },
};

/* --------------------------------------------------------------------------
   Validación
   -------------------------------------------------------------------------- */

const EXPRESION_EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

function serviciosElegidos(formulario) {
    return [...formulario.querySelectorAll('input[name="servicios"]:checked')].map((casilla) => casilla.value);
}

function validarCampo(formulario, nombre) {
    const control = formulario.elements[nombre];
    const valor = typeof control?.value === "string" ? control.value.trim() : "";

    switch (nombre) {
        case "nombre":
            if (!valor) return MENSAJES.nombre.vacio;
            if (valor.length < 3 || !valor.includes(" ")) return MENSAJES.nombre.corto;
            return "";

        case "email":
            if (!valor) return MENSAJES.email.vacio;
            if (!EXPRESION_EMAIL.test(valor)) return MENSAJES.email.invalido;
            return "";

        case "mensaje":
            if (!valor) return MENSAJES.mensaje.vacio;
            if (valor.length < 10) return MENSAJES.mensaje.corto;
            return "";

        case "servicios":
            return serviciosElegidos(formulario).length ? "" : MENSAJES.servicios.vacio;

        default:
            return "";
    }
}

/* --------------------------------------------------------------------------
   Freno de envíos
   -------------------------------------------------------------------------- */

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
        const recientes = leerEnvios().filter((marca) => ahora - marca < LIMITES.ventana);
        recientes.push(ahora);
        localStorage.setItem(CLAVE_ENVIOS, JSON.stringify(recientes));
    } catch {
        // Sin localStorage el freno se pierde; el del servidor sigue valiendo
    }
}

/** Devuelve "" si se puede enviar, o el motivo de la espera. */
function revisarFreno(nacimientoDelFormulario) {
    const ahora = Date.now();

    if (ahora - nacimientoDelFormulario < LIMITES.tiempoMinimoDeCarga) {
        return "Tomate un segundo más para revisar lo que escribiste.";
    }

    const recientes = leerEnvios().filter((marca) => ahora - marca < LIMITES.ventana);
    const ultimo = recientes[recientes.length - 1];

    if (ultimo && ahora - ultimo < LIMITES.esperaEntreEnvios) {
        const faltan = Math.ceil((LIMITES.esperaEntreEnvios - (ahora - ultimo)) / 1000);
        return `Ya recibimos tu mensaje. Esperá ${faltan} segundos antes de enviar otro.`;
    }

    if (recientes.length >= LIMITES.maximoPorHora) {
        return "Recibimos varios mensajes tuyos en la última hora. Te respondemos a la brevedad.";
    }

    return "";
}

/* --------------------------------------------------------------------------
   Envío
   -------------------------------------------------------------------------- */

async function enviar(formulario, datos) {
    const destino = formulario.dataset.endpoint;

    // Con un endpoint configurado se envía sin salir de la página
    if (destino) {
        const respuesta = await fetch(destino, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(datos),
        });

        if (!respuesta.ok) throw new Error(`El servidor respondió ${respuesta.status}`);
        return "enviado";
    }

    // Sin endpoint todavía: se abre el correo del visitante con todo escrito
    const cuerpo = [
        `Nombre: ${datos.nombre}`,
        `Email: ${datos.email}`,
        `Servicios: ${datos.servicios.join(", ")}`,
        "",
        datos.mensaje,
    ].join("\n");

    const asunto = `Nuevo proyecto: ${datos.nombre}`;
    window.location.href = `mailto:equipowinforge@gmail.com?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;

    return "correo";
}

/* --------------------------------------------------------------------------
   Arranque
   -------------------------------------------------------------------------- */

export function iniciarFormularioContacto(formulario = document.querySelector("[data-formulario-contacto]")) {
    if (!formulario) return;

    const aviso = formulario.querySelector("[data-aviso]");
    const boton = formulario.querySelector('button[type="submit"]');
    const nacimiento = Date.now();
    const campos = ["nombre", "email", "mensaje", "servicios"];
    const revisados = new Set(); // Un campo se marca recién después de tocarlo

    /** Lista los controles de un campo (las casillas son varios). */
    function controlesDe(nombre) {
        const control = formulario.elements[nombre];
        if (!control) return [];
        return typeof control.length === "number" && !(control instanceof HTMLElement) ? [...control] : [control];
    }

    function mostrarError(nombre, texto) {
        const cartel = formulario.querySelector(`[data-error="${nombre}"]`);
        if (cartel) cartel.textContent = texto;

        controlesDe(nombre).forEach((elemento) => {
            if (elemento.type === "checkbox") return; // El aviso es del grupo, no de cada casilla
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

    // Precarga: lo que el visitante eligió en el inicio ya viene marcado
    const elegidos = leerEleccion();
    if (elegidos.length) {
        formulario.querySelectorAll('input[name="servicios"]').forEach((casilla) => {
            casilla.checked = elegidos.includes(casilla.dataset.slug);
        });
    }

    // Validación en vivo: al salir del campo y, si ya se revisó, al escribir
    campos.forEach((nombre) => {
        controlesDe(nombre).forEach((elemento) => {
            elemento.addEventListener("blur", () => {
                revisados.add(nombre);
                revisar(nombre);
            });

            elemento.addEventListener(elemento.type === "checkbox" ? "change" : "input", () => {
                if (elemento.type === "checkbox") revisados.add(nombre);
                revisar(nombre);
            });
        });
    });

    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        // La trampa: si está completa es un robot. Se le dice que sí y se corta.
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

        const datos = {
            nombre: formulario.elements.nombre.value.trim(),
            email: formulario.elements.email.value.trim(),
            mensaje: formulario.elements.mensaje.value.trim(),
            servicios: serviciosElegidos(formulario),
        };

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
            aviso.textContent = "No pudimos enviarlo. Probá de nuevo o escribinos a equipowinforge@gmail.com.";
        } finally {
            boton.disabled = false;
        }
    });
}
