<?php
declare(strict_types=1);

use function Winforge\Formularios\{validar, clave, origenPermitido, ipCliente, fueraDePublico,
    abrirAlmacen, limitarIntentos, reservar, finalizar, prepararCorreo, enviarCorreo};
use Winforge\Formularios\Rechazo;

ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");
header('Referrer-Policy: no-referrer');

function responder(int $estado, array $contenido): never
{
    http_response_code($estado);
    echo json_encode($contenido, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

set_error_handler(static function (int $nivel, string $texto, string $archivo, int $linea): bool {
    if (!(error_reporting() & $nivel)) return false;
    throw new ErrorException('Error interno del formulario', 0, $nivel, $archivo, $linea);
});

try {
    require_once __DIR__ . '/../recursos/php/formularios/validacion.php';
    require_once __DIR__ . '/../recursos/php/formularios/almacen.php';
    require_once __DIR__ . '/../recursos/php/formularios/correo.php';
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        header('Allow: POST');
        throw new Rechazo(405, 'metodo', 'Usá el formulario del sitio para enviar tu consulta.');
    }
    if (strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0])) !== 'application/json' || !empty($_FILES)) {
        throw new Rechazo(415, 'formato', 'El formulario solo acepta texto en formato JSON, sin archivos adjuntos.');
    }
    if (($_SERVER['HTTP_X_WINFORGE_FORMULARIO'] ?? '') !== '1') {
        throw new Rechazo(403, 'origen', 'Enviá tu consulta desde el formulario de Winforge.');
    }
    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 16384) {
        throw new Rechazo(413, 'tamanio', 'La consulta es demasiado larga. Reducí el mensaje e intentá de nuevo.');
    }
    $publico = realpath($_SERVER['DOCUMENT_ROOT'] ?? '') ?: dirname(__DIR__);
    $rutaConfig = getenv('WINFORGE_FORMULARIOS_CONFIG') ?: dirname(__DIR__, 2) . '/winforge-privado/formularios.php';
    $rutaConfig = realpath($rutaConfig);
    if (!$rutaConfig || !fueraDePublico($rutaConfig, $publico) || !fueraDePublico($rutaConfig, dirname(__DIR__))) {
        throw new RuntimeException('Configuración privada pendiente');
    }
    $config = require $rutaConfig;
    if (!is_array($config) || ($config['activo'] ?? false) !== true ||
        !is_string($config['secreto'] ?? null) || strlen($config['secreto']) < 64 ||
        !is_array($config['origenes'] ?? null)) {
        throw new RuntimeException('Configuración incompleta');
    }
    $desarrollo = ($config['entorno'] ?? '') === 'desarrollo' &&
        in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'], true);
    if (!$desarrollo && (($_SERVER['HTTPS'] ?? '') !== 'on') && (($_SERVER['SERVER_PORT'] ?? '') !== '443')) {
        throw new Rechazo(403, 'https', 'Abrí el sitio con HTTPS para enviar tu consulta.');
    }
    if (!origenPermitido($_SERVER, $config['origenes'])) {
        throw new Rechazo(403, 'origen', 'Enviá tu consulta desde el sitio de Winforge.');
    }
    $db = abrirAlmacen($config['directorio_privado'], $publico);
    $ip = clave('ip:' . ipCliente($_SERVER), $config['secreto']);
    limitarIntentos($db, $ip, time());
    $crudo = file_get_contents('php://input', false, null, 0, 16385);
    if ($crudo === false || strlen($crudo) > 16384) throw new Rechazo(413, 'tamanio', 'La consulta es demasiado larga.');
    try {
        $objeto = json_decode($crudo, false, 8, JSON_THROW_ON_ERROR);
    } catch (JsonException $e) {
        throw new Rechazo(400, 'json', 'No pudimos leer la consulta. Recargá la página e intentá de nuevo.');
    }
    if (!$objeto instanceof stdClass) throw new Rechazo(400, 'json', 'La solicitud no tiene el formato esperado.');
    $entrada = (array)$objeto;
    $datos = validar($entrada);
    if (trim($entrada['empresa']) !== '') {
        responder(200, ['success' => true, 'message' => 'Gracias por escribirnos.']);
    }
    // Preparar antes de reservar: una configuración incorrecta no consume un envío.
    $correo = prepararCorreo($config, $datos);
    $id = clave('solicitud:' . $entrada['solicitud'], $config['secreto']);
    $huella = clave(json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR), $config['secreto']);
    $email = clave('email:' . strtolower($datos['email']), $config['secreto']);
    if (reservar($db, $id, $huella, $ip, $email, time()) === 'nuevo') {
        try {
            enviarCorreo($correo);
            finalizar($db, $id, 'enviado');
        } catch (Throwable $e) {
            // El transporte puede haber aceptado el correo aunque falle la confirmación.
            // Nunca reintentamos automáticamente un envío cuyo resultado es incierto.
            finalizar($db, $id, 'incierto');
            error_log('Winforge formularios: envío incierto, referencia ' . substr($id, 0, 12));
            throw new Rechazo(503, 'incierto', 'No pudimos confirmar el envío. Conservamos el texto en pantalla; escribinos a info@winforge.com si necesitás confirmar tu consulta.');
        }
    }
    responder(200, ['success' => true, 'message' => '¡Gracias! Tu consulta fue enviada. Te responderemos al email que ingresaste.']);
} catch (Rechazo $e) {
    if ($e->espera) header('Retry-After: ' . $e->espera);
    responder($e->estado, ['success' => false, 'code' => $e->codigo, 'message' => $e->getMessage(),
        'errors' => (object)$e->campos, 'retryAfter' => $e->espera]);
} catch (Throwable $e) {
    error_log('Winforge formularios: fallo interno (' . get_class($e) . ')');
    responder(503, ['success' => false, 'code' => 'no_disponible',
        'message' => 'El envío no está disponible por el momento. Tu texto sigue en pantalla; podés escribirnos a info@winforge.com.']);
}
