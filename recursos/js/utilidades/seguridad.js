/**
 * Limpieza y revisión de lo que escribe la gente en el formulario.
 * Todo lo de acá corre en el navegador: sirve para frenar bots simples y para
 * que nunca salga un texto raro hacia el correo, no reemplaza al servidor.
 */

/* Caracteres invisibles que usan para esconder texto o dar vuelta la lectura. */
const INVISIBLES = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F­​-‏‪-‮⁠-⁤⁦-⁯﻿]/g;

/* Alfabetos que no usamos: casi todo el spam que llega viene en estos. */
const ESCRITURAS = [
    { nombre: "cirílico", patron: /[Ѐ-ӿԀ-ԯ]/ },
    { nombre: "griego", patron: /[Ͱ-Ͽἀ-῿]/ },
    { nombre: "hebreo", patron: /[֐-׿]/ },
    { nombre: "árabe", patron: /[؀-ۿݐ-ݿ]/ },
    { nombre: "devanagari", patron: /[ऀ-ॿ]/ },
    { nombre: "tailandés", patron: /[฀-๿]/ },
    { nombre: "chino o japonés", patron: /[⺀-鿿぀-ヿ]/ },
    { nombre: "coreano", patron: /[가-힯ᄀ-ᇿ]/ },
];

/* Un dominio entero cuenta como un solo enlace, con o sin https:// y www. */
const ENLACES =
    /\b(?:https?:\/\/)?(?:www\.)?[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.(?:com|net|org|edu|gov|ar|io|co|app|dev|es|mx|cl|uy|br|ru|cn|xyz|top|info|biz|shop|club|online|site|live|link)\b(?:\/\S*)?/gi;
const MARCADO = /(<\s*\/?\s*[a-z][^>]*>|\[\/?(url|link|img|b|i)\b[^\]]*\])/i;
const EXPRESION_EMAIL = /^[^\s@<>"'();,]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,24}$/i;
const NOMBRE_VALIDO = /^[\p{L}\p{M}][\p{L}\p{M}'’\-. ]*$/u;

/**
 * Deja el texto en una sola forma: sin caracteres de control, sin invisibles,
 * sin saltos de línea de más y recortado al largo que admitimos.
 */
export function limpiarTexto(valor, { maximo = 1200, conSaltos = false } = {}) {
    if (typeof valor !== "string") return "";

    let texto = valor.normalize("NFC").replace(INVISIBLES, "");

    texto = conSaltos
        ? texto.replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n")
        : texto.replace(/\s+/g, " ");

    return texto.trim().slice(0, maximo);
}

/* Devuelve el nombre del alfabeto ajeno que aparezca, o cadena vacía. */
export function escrituraAjena(texto) {
    const encontrada = ESCRITURAS.find(({ patron }) => patron.test(texto));
    return encontrada ? encontrada.nombre : "";
}

export function cuantosEnlaces(texto) {
    return (texto.match(ENLACES) ?? []).length;
}

export function tieneMarcado(texto) {
    return MARCADO.test(texto);
}

export function esEmailRazonable(valor) {
    if (valor.length > 120) return false;
    if (/[\r\n,;]/.test(valor)) return false;
    return EXPRESION_EMAIL.test(valor);
}

export function esNombreRazonable(valor) {
    return valor.length >= 3 && valor.length <= 80 && NOMBRE_VALIDO.test(valor);
}

/* Un texto con una sola letra repetida, o casi sin espacios, no es un mensaje. */
export function pareceRelleno(texto) {
    if (/(.)\1{9,}/.test(texto)) return true;

    const palabras = texto.split(/\s+/).filter(Boolean);
    if (palabras.length < 3) return true;

    return palabras.some((palabra) => palabra.length > 40);
}
