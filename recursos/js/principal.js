import { iniciarScroll } from "./utilidades/scroll.js";
import { iniciarFondoAtmosfera } from "./componentes/fondo-atmosfera.js";
import { iniciarNavegacionIndice } from "./componentes/navegacion-indice.js";
import { iniciarRevelarAlEntrar } from "./componentes/revelar-al-entrar.js";
import { iniciarTarjetasInteractivas } from "./componentes/tarjeta-interactiva.js";

export function iniciarSitio() {
    iniciarScroll();
    iniciarFondoAtmosfera();
    iniciarNavegacionIndice();
    iniciarRevelarAlEntrar();
    iniciarTarjetasInteractivas();
}
