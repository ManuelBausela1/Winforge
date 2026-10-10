<?php
declare(strict_types=1);
namespace Winforge\Formularios;

function prepararCorreo(array $config, array $datos): array
{
    if (!function_exists('mail')) {
        throw new \RuntimeException('Envío nativo de PHP no disponible');
    }
    // Una sola dirección por campo, sin caracteres de control ni cabeceras añadidas.
    // Revalidar también la configuración privada antes de reservar un envío.
    foreach ([$config['desde'] ?? null, $config['destinatario'] ?? null, $datos['email'] ?? null] as $direccion) {
        if (!is_string($direccion) || preg_match('/[\x00-\x20\x7F]/', $direccion) ||
            !filter_var($direccion, FILTER_VALIDATE_EMAIL)) {
            throw new \RuntimeException('Dirección de correo no válida');
        }
    }
    $asuntos = ['contacto' => 'Consulta de contacto', 'planes' => 'Consulta de planes',
        'm360' => 'Diagnóstico M360', 'rayuela' => 'Demostración de Rayuela'];
    if (!isset($asuntos[$datos['formulario'] ?? ''])) {
        throw new \RuntimeException('Formulario de correo no válido');
    }
    $asunto = '[Winforge] ' . $asuntos[$datos['formulario']];
    $etiquetas = ['nombre' => 'Nombre', 'email' => 'Email', 'tipo' => 'Marca o institución',
        'institucion' => 'Institución', 'cargo' => 'Cargo', 'servicios' => 'Servicios',
        'plan' => 'Plan', 'nivel' => 'Nivel', 'alumnos' => 'Cantidad de alumnos', 'mensaje' => 'Mensaje'];
    $lineas = ['Consulta recibida desde el formulario de ' . $datos['formulario'] . '.', ''];
    foreach ($etiquetas as $campo => $etiqueta) {
        if (isset($datos[$campo])) $lineas[] = $etiqueta . ': ' . (is_array($datos[$campo]) ? implode(', ', $datos[$campo]) : $datos[$campo]);
    }
    $texto = str_replace(["\r\n", "\r"], "\n", implode("\n\n", $lineas));
    return [
        'destinatario' => $config['destinatario'],
        'asunto' => '=?UTF-8?B?' . base64_encode($asunto) . '?=',
        'cuerpo' => chunk_split(base64_encode(str_replace("\n", "\r\n", $texto)), 68, "\r\n"),
        'cabeceras' => [
            'From' => 'Winforge <' . $config['desde'] . '>',
            'Reply-To' => $datos['email'],
            'MIME-Version' => '1.0',
            'Content-Type' => 'text/plain; charset=UTF-8',
            'Content-Transfer-Encoding' => 'base64',
        ],
    ];
}

function enviarCorreo(array $correo): void
{
    // El hosting configura el transporte. Nunca pasar opciones de consola (-f,
    // etc.) ni un quinto argumento derivado de los datos del visitante.
    if (!\mail($correo['destinatario'], $correo['asunto'], $correo['cuerpo'], $correo['cabeceras'])) {
        throw new \RuntimeException('El servidor no confirmó el envío');
    }
}
