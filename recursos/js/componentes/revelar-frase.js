export function prepararFraseAnimada(elemento) {
    if (!elemento) return null;

    elemento.classList.add("frase-animada");

    return {
        revelar: () => elemento.classList.add("esta-visible"),
    };
}
