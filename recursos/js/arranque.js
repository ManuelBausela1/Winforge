(function () {
    document.documentElement.classList.add("js");

    var clave = "winforge:visitada:" + location.pathname;

    try {
        if (location.search.indexOf("animar") !== -1 || !sessionStorage.getItem(clave)) {
            document.documentElement.classList.add("animar");
            sessionStorage.setItem(clave, "1");
        }
    } catch (error) {
        document.documentElement.classList.add("animar");
    }
})();
