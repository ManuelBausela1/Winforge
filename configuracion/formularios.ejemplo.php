<?php
// Copiar FUERA de public_html / htdocs / la raíz del sitio. No completar aquí.
// Ruta predeterminada: ../winforge-privado/formularios.php respecto de la raíz.
// Alternativa: variable de servidor WINFORGE_FORMULARIOS_CONFIG con ruta absoluta.
return [
    'activo' => false,
    'entorno' => 'produccion',
    'origenes' => ['https://winforge.com.ar', 'https://www.winforge.com.ar'],
    // Generar con PHP: bin2hex(random_bytes(32)). No reutilizar contraseñas.
    'secreto' => '',
    // Crear esta carpeta privada con permisos 0700 y escritura para PHP.
    'directorio_privado' => __DIR__ . '/datos',
    // El hosting debe habilitar mail() y autorizar este remitente.
    // No se necesitan usuario ni contraseña SMTP en este archivo.
    'desde' => 'info@winforge.com',
    'destinatario' => 'info@winforge.com',
];
