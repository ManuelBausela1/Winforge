/* ==========================================================================
   COMPONENTE — FONDO FLUIDO (WebGL)
   Dibuja el shader de humo líquido en un canvas a media resolución.
   Solo se vuelve a dibujar cuando cambia el scroll o el tamaño de ventana.
   Devuelve null si el navegador no soporta WebGL: el CSS tiene un respaldo.
   ========================================================================== */

import { shaderFragmentos, shaderVertices } from "../shaders/fondo-fluido.js";

const ESCALA_RESOLUCION = 0.5; // 50 % de los píxeles CSS: las formas son suaves y rinde mucho mejor

function compilarShader(gl, tipo, codigo) {
    const shader = gl.createShader(tipo);
    gl.shaderSource(shader, codigo);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Error al compilar el shader del fondo:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function crearPrograma(gl) {
    const vertices = compilarShader(gl, gl.VERTEX_SHADER, shaderVertices);
    const fragmentos = compilarShader(gl, gl.FRAGMENT_SHADER, shaderFragmentos);
    if (!vertices || !fragmentos) return null;

    const programa = gl.createProgram();
    gl.attachShader(programa, vertices);
    gl.attachShader(programa, fragmentos);
    gl.linkProgram(programa);

    if (!gl.getProgramParameter(programa, gl.LINK_STATUS)) {
        console.error("Error al enlazar el programa del fondo:", gl.getProgramInfoLog(programa));
        return null;
    }

    return programa;
}

export function crearFondoFluido(lienzo) {
    const gl = lienzo.getContext("webgl", {
        alpha: false,
        antialias: false,
        depth: false,
        powerPreference: "low-power",
    });
    if (!gl) return null;

    const programa = crearPrograma(gl);
    if (!programa) return null;

    gl.useProgram(programa);

    // Un triángulo que cubre toda la pantalla
    const bufer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const atributoPosicion = gl.getAttribLocation(programa, "aPosicion");
    gl.enableVertexAttribArray(atributoPosicion);
    gl.vertexAttribPointer(atributoPosicion, 2, gl.FLOAT, false, 0, 0);

    const uniformes = {
        resolucion: gl.getUniformLocation(programa, "uResolucion"),
        scroll: gl.getUniformLocation(programa, "uScroll"),
        temaClaro: gl.getUniformLocation(programa, "uTemaClaro"),
    };

    return {
        redimensionar(ancho, alto) {
            lienzo.width = Math.max(1, Math.round(ancho * ESCALA_RESOLUCION));
            lienzo.height = Math.max(1, Math.round(alto * ESCALA_RESOLUCION));
            gl.viewport(0, 0, lienzo.width, lienzo.height);
            gl.uniform2f(uniformes.resolucion, lienzo.width, lienzo.height);
        },

        dibujar({ scroll, temaClaro }) {
            gl.uniform1f(uniformes.scroll, scroll);
            gl.uniform1f(uniformes.temaClaro, temaClaro);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        },
    };
}
