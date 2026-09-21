const consultaMovimientoReducido = window.matchMedia("(prefers-reduced-motion: reduce)");
const consultaPunteroFino = window.matchMedia("(hover: hover) and (pointer: fine)");

export function prefiereMovimientoReducido() {
    return consultaMovimientoReducido.matches;
}

export function tienePunteroFino() {
    return consultaPunteroFino.matches;
}

export function interpolar(actual, objetivo, suavidad) {
    return actual + (objetivo - actual) * suavidad;
}

export function limitar(valor, minimo, maximo) {
    return Math.min(Math.max(valor, minimo), maximo);
}

export function moduloPositivo(valor, divisor) {
    return ((valor % divisor) + divisor) % divisor;
}
