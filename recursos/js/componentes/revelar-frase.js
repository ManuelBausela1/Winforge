/* ==========================================================================
   COMPONENTE — REVELAR FRASE
   Divide un texto en palabras (respetando <em> y otras etiquetas en línea)
   y las hace emerger una por una. El texto original queda disponible para
   lectores de pantalla y buscadores; la copia animada es decorativa.
   ========================================================================== */

export function prepararFraseAnimada(elemento) {
    if (!elemento) return null;

    const textoAccesible = document.createElement("span");
    textoAccesible.className = "texto-oculto";
    textoAccesible.textContent = elemento.textContent.replace(/\s+/g, " ").trim();

    const copiaVisual = document.createElement("span");
    copiaVisual.setAttribute("aria-hidden", "true");

    let indicePalabra = 0;

    const crearPalabra = (texto) => {
        const palabra = document.createElement("span");
        const interior = document.createElement("span");

        palabra.className = "frase-animada__palabra";
        interior.className = "frase-animada__interior";
        interior.textContent = texto;
        interior.style.setProperty("--indice-palabra", indicePalabra++);
        palabra.append(interior);

        return palabra;
    };

    const dividirNodo = (nodoOrigen, destino) => {
        nodoOrigen.childNodes.forEach((nodo) => {
            if (nodo.nodeType === Node.TEXT_NODE) {
                nodo.textContent.split(/(\s+)/).forEach((fragmento) => {
                    if (!fragmento) return;
                    destino.append(/^\s+$/.test(fragmento) ? " " : crearPalabra(fragmento));
                });
                return;
            }

            if (nodo.nodeType === Node.ELEMENT_NODE) {
                const clon = nodo.cloneNode(false);
                dividirNodo(nodo, clon);
                destino.append(clon);
            }
        });
    };

    dividirNodo(elemento, copiaVisual);
    elemento.replaceChildren(textoAccesible, copiaVisual);
    elemento.classList.add("frase-animada");

    return {
        cantidadPalabras: indicePalabra,
        revelar: () => elemento.classList.add("esta-visible"),
    };
}
