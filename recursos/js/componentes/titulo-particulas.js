/* ==========================================================================
   COMPONENTE — TÍTULO DE PARTÍCULAS
   Adaptación a JS puro del "ParticleTextEffect" (21st.dev):
   miles de partículas cruzan el hero y forman "Winforge" en Cormorant
   Garamond dentro del <h1>. Mientras viajan dejan líneas eucalipto; al
   llegar a su lugar se vuelven blancas y la palabra queda fija.
   El mouse aparta las partículas cercanas y luego vuelven a su lugar.
   El lienzo es transparente: se ve el fondo y el resto del hero.
   Devuelve una promesa que se resuelve cuando la palabra quedó formada,
   para encadenar la aparición del resto del hero. Con conEntrada en false
   (visita repetida) la palabra ya aparece armada, pero el mouse la sigue
   apartando igual.
   ========================================================================== */

import { prefiereMovimientoReducido, tienePunteroFino } from "../utilidades/movimiento.js";

const CONFIGURACION = {
    pesoFuente: 500,
    familiaFuente: '"Cormorant Garamond", serif',

    colorLinea: { r: 129, g: 161, b: 152 }, // Eucalipto: partículas en viaje
    colorPalabra: { r: 255, g: 255, b: 255 }, // Blanco: partículas en su lugar
    largoLinea: 4, // Largo de la estela = velocidad × este factor
    nivelesDeColor: 6, // Tonos intermedios eucalipto → blanco (menos = más rápido)

    distanciaFrenado: 90, // px: desde acá la partícula empieza a frenar
    distanciaBlanco: 50, // px: desde acá empieza a volverse blanca
    distanciaReposo: 0.4, // px: se considera quieta en su lugar
    distanciaFormada: 2, // px: cerca de su lugar para considerar la palabra formada
    proporcionFormada: 0.95, // % de partículas que deben estar en su lugar
    tiempoMaximoFormacion: 4500, // ms: por si algún equipo es lento

    radioMouse: 80, // px: alcance del empuje del mouse
    fuerzaMouse: 5,

    esperaMaximaFuente: 1500, // ms esperando a Cormorant antes de seguir
};

/* --------------------------------------------------------------------------
   Partícula
   -------------------------------------------------------------------------- */

class Particula {
    constructor({ x, y, objetivo, velocidadMaxima }) {
        this.posicion = { x, y };
        this.velocidad = { x: 0, y: 0 };
        this.objetivo = objetivo;
        this.velocidadMaxima = velocidadMaxima;
        this.fuerzaMaxima = velocidadMaxima * 0.05;
    }

    distanciaAlObjetivo() {
        return Math.hypot(this.objetivo.x - this.posicion.x, this.objetivo.y - this.posicion.y);
    }

    estaEnReposo() {
        return this.distanciaAlObjetivo() < CONFIGURACION.distanciaReposo
            && Math.hypot(this.velocidad.x, this.velocidad.y) < CONFIGURACION.distanciaReposo;
    }

    /** Dirección hacia el objetivo con frenado progresivo al acercarse. */
    mover() {
        const distancia = this.distanciaAlObjetivo();
        const factorFrenado = Math.min(distancia / CONFIGURACION.distanciaFrenado, 1);

        let deseadaX = this.objetivo.x - this.posicion.x;
        let deseadaY = this.objetivo.y - this.posicion.y;

        if (distancia > 0) {
            deseadaX = (deseadaX / distancia) * this.velocidadMaxima * factorFrenado;
            deseadaY = (deseadaY / distancia) * this.velocidadMaxima * factorFrenado;
        }

        let direccionX = deseadaX - this.velocidad.x;
        let direccionY = deseadaY - this.velocidad.y;
        const magnitud = Math.hypot(direccionX, direccionY);

        if (magnitud > this.fuerzaMaxima) {
            direccionX = (direccionX / magnitud) * this.fuerzaMaxima;
            direccionY = (direccionY / magnitud) * this.fuerzaMaxima;
        }

        this.velocidad.x += direccionX;
        this.velocidad.y += direccionY;
        this.posicion.x += this.velocidad.x;
        this.posicion.y += this.velocidad.y;
    }

    /** Empuje radial desde el mouse. */
    empujar(mouseX, mouseY) {
        const dx = this.posicion.x - mouseX;
        const dy = this.posicion.y - mouseY;
        const distancia = Math.hypot(dx, dy);

        if (distancia > 0 && distancia < CONFIGURACION.radioMouse) {
            const intensidad = (1 - distancia / CONFIGURACION.radioMouse) * CONFIGURACION.fuerzaMouse;
            this.velocidad.x += (dx / distancia) * intensidad;
            this.velocidad.y += (dy / distancia) * intensidad;
        }
    }
}

/* --------------------------------------------------------------------------
   Utilidades
   -------------------------------------------------------------------------- */

function esperar(milisegundos) {
    return new Promise((resolver) => setTimeout(resolver, milisegundos));
}

async function esperarFuente() {
    const fuente = `${CONFIGURACION.pesoFuente} 100px ${CONFIGURACION.familiaFuente}`;

    try {
        await Promise.race([document.fonts.load(fuente), esperar(CONFIGURACION.esperaMaximaFuente)]);
    } catch {
        // Si falla la carga se usa la serif de respaldo
    }
}

/** Punto aleatorio sobre un círculo que rodea la escena. */
function puntoFueraDeEscena(ancho, alto) {
    const angulo = Math.random() * Math.PI * 2;
    const radio = Math.hypot(ancho, alto) / 2;

    return {
        x: ancho / 2 + Math.cos(angulo) * radio,
        y: alto / 2 + Math.sin(angulo) * radio,
    };
}

/**
 * Rasteriza la palabra dentro del rectángulo del título y devuelve las
 * coordenadas (relativas al lienzo) donde hay "tinta".
 */
function obtenerPuntosDePalabra(palabra, zona, paso) {
    const lienzoTemporal = document.createElement("canvas");
    const ancho = Math.max(1, Math.round(zona.ancho));
    const alto = Math.max(1, Math.round(zona.alto));

    lienzoTemporal.width = ancho;
    lienzoTemporal.height = alto;

    const contexto = lienzoTemporal.getContext("2d", { willReadFrequently: true });
    const fuente = (tamano) => `${CONFIGURACION.pesoFuente} ${tamano}px ${CONFIGURACION.familiaFuente}`;

    // Tamaño de fuente: lo más grande posible que entre en la zona
    let tamanoFuente = alto * 0.95;
    contexto.font = fuente(tamanoFuente);
    const anchoTexto = contexto.measureText(palabra).width;

    if (anchoTexto > ancho * 0.98) {
        tamanoFuente *= (ancho * 0.98) / anchoTexto;
    }

    contexto.font = fuente(tamanoFuente);
    contexto.fillStyle = "#FFFFFF";
    contexto.textAlign = "center";
    contexto.textBaseline = "middle";
    contexto.fillText(palabra, ancho / 2, alto / 2);

    const { data: pixeles } = contexto.getImageData(0, 0, ancho, alto);
    const puntos = [];

    for (let y = 0; y < alto; y += paso) {
        for (let x = 0; x < ancho; x += paso) {
            if (pixeles[(y * ancho + x) * 4 + 3] > 128) {
                puntos.push({ x: zona.x + x, y: zona.y + y });
            }
        }
    }

    return puntos;
}

/* --------------------------------------------------------------------------
   Componente
   -------------------------------------------------------------------------- */

export async function iniciarTituloParticulas(contenedor = document.querySelector("[data-hero]"), { conEntrada = true } = {}) {
    const titulo = contenedor?.querySelector("[data-titulo-particulas]");
    const lienzo = contenedor?.querySelector("[data-titulo-lienzo]");
    if (!titulo || !lienzo) return;

    let avisarPalabraFormada;
    let palabraFormada = false;
    const promesaFormada = new Promise((resolver) => {
        avisarPalabraFormada = () => {
            if (palabraFormada) return;
            palabraFormada = true;
            resolver();
        };
    });

    const palabra = titulo.textContent.trim();
    const contexto = lienzo.getContext("2d");
    const movimientoReducido = prefiereMovimientoReducido();

    let ancho = 0;
    let alto = 0;
    let particulas = [];
    let tamanoParticula = 2;
    let idFotograma = null;
    let estaEnPantalla = true;
    const mouse = { x: 0, y: 0, activo: false };

    await esperarFuente();

    /* ----------------------------------------------------------------------
       Preparación
       ---------------------------------------------------------------------- */

    function medir() {
        const resolucion = Math.min(window.devicePixelRatio || 1, 2);
        const limitesContenedor = contenedor.getBoundingClientRect();
        const limitesTitulo = titulo.getBoundingClientRect();

        ancho = limitesContenedor.width;
        alto = limitesContenedor.height;
        lienzo.width = Math.round(ancho * resolucion);
        lienzo.height = Math.round(alto * resolucion);
        contexto.setTransform(resolucion, 0, 0, resolucion, 0, 0);

        return {
            x: limitesTitulo.left - limitesContenedor.left,
            y: limitesTitulo.top - limitesContenedor.top,
            ancho: limitesTitulo.width,
            alto: limitesTitulo.height,
        };
    }

    /** Asigna un objetivo a cada partícula; crea o descarta las que sobran. */
    function construir({ desdeFuera }) {
        const zona = medir();
        const esPantallaChica = ancho < 768;
        const paso = 2; // px entre partículas: más bajo = palabra más definida
        tamanoParticula = esPantallaChica ? 1.3 : 1.7;

        const puntos = obtenerPuntosDePalabra(palabra, zona, paso);
        const escalaVelocidad = Math.max(ancho / 1440, 0.6);

        particulas = puntos.map((punto, indice) => {
            const existente = particulas[indice];

            if (existente) {
                existente.objetivo = punto;
                return existente;
            }

            const inicio = desdeFuera && !movimientoReducido ? puntoFueraDeEscena(ancho, alto) : punto;

            return new Particula({
                x: inicio.x,
                y: inicio.y,
                objetivo: punto,
                velocidadMaxima: (Math.random() * 6 + 5) * escalaVelocidad,
            });
        });
    }

    /* ----------------------------------------------------------------------
       Dibujo
       ---------------------------------------------------------------------- */

    function dibujar() {
        contexto.clearRect(0, 0, ancho, alto);

        const { colorLinea, colorPalabra, nivelesDeColor, largoLinea } = CONFIGURACION;
        const puntosPorNivel = Array.from({ length: nivelesDeColor }, () => []);

        // Líneas: todas en un solo trazo para rendir bien con miles de partículas
        contexto.beginPath();

        for (const particula of particulas) {
            const velocidad = Math.hypot(particula.velocidad.x, particula.velocidad.y);

            if (velocidad > 0.6) {
                contexto.moveTo(
                    particula.posicion.x - particula.velocidad.x * largoLinea,
                    particula.posicion.y - particula.velocidad.y * largoLinea,
                );
                contexto.lineTo(particula.posicion.x, particula.posicion.y);
            }

            const cercania = 1 - Math.min(particula.distanciaAlObjetivo() / CONFIGURACION.distanciaBlanco, 1);
            const nivel = Math.min(Math.floor(cercania * nivelesDeColor), nivelesDeColor - 1);
            puntosPorNivel[nivel].push(particula);
        }

        contexto.strokeStyle = `rgba(${colorLinea.r}, ${colorLinea.g}, ${colorLinea.b}, 0.45)`;
        contexto.lineWidth = 1;
        contexto.stroke();

        // Puntos: agrupados por tono, de eucalipto (lejos) a blanco (en su lugar)
        puntosPorNivel.forEach((grupo, nivel) => {
            if (!grupo.length) return;

            const mezcla = nivel / (nivelesDeColor - 1);
            const r = Math.round(colorLinea.r + (colorPalabra.r - colorLinea.r) * mezcla);
            const g = Math.round(colorLinea.g + (colorPalabra.g - colorLinea.g) * mezcla);
            const b = Math.round(colorLinea.b + (colorPalabra.b - colorLinea.b) * mezcla);

            contexto.fillStyle = `rgb(${r}, ${g}, ${b})`;
            grupo.forEach((particula) => {
                contexto.fillRect(particula.posicion.x, particula.posicion.y, tamanoParticula, tamanoParticula);
            });
        });
    }

    /* ----------------------------------------------------------------------
       Animación (se detiene sola cuando todo está quieto)
       ---------------------------------------------------------------------- */

    function animar() {
        let enMovimiento = false;
        let enSuLugar = 0;

        for (const particula of particulas) {
            if (mouse.activo) particula.empujar(mouse.x, mouse.y);
            particula.mover();
            if (!particula.estaEnReposo()) enMovimiento = true;
            if (particula.distanciaAlObjetivo() < CONFIGURACION.distanciaFormada) enSuLugar++;
        }

        dibujar();

        if (!palabraFormada && enSuLugar / particulas.length >= CONFIGURACION.proporcionFormada) {
            avisarPalabraFormada();
        }

        idFotograma = enMovimiento || mouse.activo ? requestAnimationFrame(animar) : null;
    }

    function iniciarAnimacion() {
        if (idFotograma === null && estaEnPantalla && !movimientoReducido) {
            idFotograma = requestAnimationFrame(animar);
        }
    }

    /* ----------------------------------------------------------------------
       Eventos
       ---------------------------------------------------------------------- */

    if (tienePunteroFino() && !movimientoReducido) {
        contenedor.addEventListener("pointermove", (evento) => {
            const limites = contenedor.getBoundingClientRect();
            mouse.x = evento.clientX - limites.left;
            mouse.y = evento.clientY - limites.top;
            mouse.activo = true;
            iniciarAnimacion();
        });

        contenedor.addEventListener("pointerleave", () => {
            mouse.activo = false;
        });
    }

    new IntersectionObserver(([entrada]) => {
        estaEnPantalla = entrada.isIntersecting;
        if (estaEnPantalla) iniciarAnimacion();
    }).observe(contenedor);

    /* ----------------------------------------------------------------------
       Arranque
       ---------------------------------------------------------------------- */

    // Sin entrada (visita repetida) las partículas nacen ya en su lugar
    construir({ desdeFuera: conEntrada });
    titulo.classList.add("esta-lista");
    dibujar();
    iniciarAnimacion();

    // Sin animación la palabra ya está formada; con animación, un límite de seguridad
    if (movimientoReducido || !conEntrada || !particulas.length) {
        avisarPalabraFormada();
    } else {
        setTimeout(avisarPalabraFormada, CONFIGURACION.tiempoMaximoFormacion);
    }

    // Si cambia el tamaño del hero (ventana, fuentes, etc.) se recalcula la palabra
    let temporizadorRedimension;
    let medidasAnteriores = `${ancho}x${alto}`;

    new ResizeObserver(() => {
        clearTimeout(temporizadorRedimension);
        temporizadorRedimension = setTimeout(() => {
            const { width, height } = contenedor.getBoundingClientRect();
            const medidas = `${width}x${height}`;
            if (medidas === medidasAnteriores) return;

            medidasAnteriores = medidas;
            construir({ desdeFuera: false });
            dibujar();
            iniciarAnimacion();
        }, 150);
    }).observe(contenedor);

    return promesaFormada;
}
