<?php
declare(strict_types=1);

namespace Winforge\Formularios;

const OPCIONES = [
    'tipo' => ['Marca', 'Institución'],
    'servicios' => ['Estrategia y marca', 'Contenido y producción', 'Web y campañas'],
    'plan' => ['Presencia', 'Crecimiento', 'Gestión', 'A medida', 'Todavía no sé'],
    'nivel' => ['Presencia escolar', 'Admisión', 'Alumbra', 'Rayuela', 'Todavía no sé'],
    'alumnos' => ['Hasta 300 alumnos', '301 a 600 alumnos', '601 a 1.000 alumnos', 'Más de 1.000 alumnos', 'Todavía no sé'],
];
const CAMPOS = [
    'contacto' => ['nombre', 'email', 'tipo', 'servicios', 'mensaje'],
    'planes' => ['nombre', 'email', 'plan', 'mensaje'],
    'm360' => ['nombre', 'email', 'institucion', 'cargo', 'nivel', 'mensaje'],
    'rayuela' => ['nombre', 'email', 'institucion', 'cargo', 'alumnos', 'mensaje'],
];

final class Rechazo extends \RuntimeException
{
    public function __construct(public int $estado, public string $codigo, string $mensaje,
        public array $campos = [], public int $espera = 0)
    {
        parent::__construct($mensaje);
    }
}

function validar(array $entrada): array
{
    $formulario = $entrada['formulario'] ?? null;
    if (!is_string($formulario) || !isset(CAMPOS[$formulario])) {
        throw new Rechazo(400, 'formulario', 'El formulario no es válido. Recargá la página.');
    }
    $permitidos = array_merge(CAMPOS[$formulario], ['formulario', 'empresa', 'solicitud']);
    if (array_diff(array_keys($entrada), $permitidos)) {
        throw new Rechazo(400, 'campos', 'La solicitud contiene campos no permitidos.');
    }
    if (!is_string($entrada['solicitud'] ?? null) ||
        !preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/D', $entrada['solicitud'])) {
        throw new Rechazo(400, 'solicitud', 'Recargá la página antes de volver a enviar.');
    }
    if (!is_string($entrada['empresa'] ?? null) || strlen($entrada['empresa']) > 200) {
        throw new Rechazo(400, 'estructura', 'No pudimos validar la solicitud.');
    }
    $datos = ['formulario' => $formulario];
    $errores = [];
    foreach (CAMPOS[$formulario] as $campo) {
        $valor = $entrada[$campo] ?? null;
        if ($campo === 'servicios') {
            if (!is_array($valor) || !array_is_list($valor) || count($valor) < 1 || count($valor) > 3 ||
                array_filter($valor, fn($v) => !is_string($v) || !in_array($v, OPCIONES['servicios'], true))) {
                $errores[$campo] = 'Elegí uno o varios servicios de la lista.';
            } else {
                $datos[$campo] = array_values(array_unique($valor));
            }
            continue;
        }
        $maximo = ['nombre' => 80, 'email' => 120, 'institucion' => 120, 'cargo' => 80, 'mensaje' => 1200][$campo] ?? 60;
        if (!is_string($valor) || !mb_check_encoding($valor, 'UTF-8') || mb_strlen($valor, 'UTF-8') > $maximo ||
            preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\x{202A}-\x{202E}\x{2066}-\x{2069}]/u', $valor)) {
            $errores[$campo] = "Ingresá texto válido de hasta $maximo caracteres.";
            continue;
        }
        if ($campo !== 'mensaje' && preg_match('/[\r\n]/', $valor)) {
            $errores[$campo] = 'Este campo debe ir en una sola línea.';
            continue;
        }
        $valor = trim(str_replace(["\r\n", "\r"], "\n", $valor));
        if ($valor === '') {
            $errores[$campo] = 'Completá este campo.';
        } elseif (isset(OPCIONES[$campo]) && !in_array($valor, OPCIONES[$campo], true)) {
            $errores[$campo] = 'Elegí una opción de la lista.';
        } elseif ($campo === 'email' && !filter_var($valor, FILTER_VALIDATE_EMAIL)) {
            $errores[$campo] = 'Revisá el email para que podamos responderte.';
        } elseif ($campo === 'nombre' && (mb_strlen($valor, 'UTF-8') < 3 ||
            !preg_match("/^[\p{L}\p{M}][\p{L}\p{M}'’\-. ]*$/u", $valor))) {
            $errores[$campo] = 'Revisá tu nombre y apellido.';
        } elseif (in_array($campo, ['institucion', 'cargo'], true) && mb_strlen($valor, 'UTF-8') < 3) {
            $errores[$campo] = 'Completá este dato con un poco más de detalle.';
        } elseif ($campo === 'mensaje' && mb_strlen($valor, 'UTF-8') < 10) {
            $errores[$campo] = 'Contanos un poco más sobre tu proyecto (al menos 10 caracteres).';
        }
        // Texto plano: no se ejecuta, interpreta ni incluye en cabeceras.
        $datos[$campo] = $valor;
    }
    if ($errores) {
        throw new Rechazo(422, 'validacion', 'Revisá los campos marcados.', $errores);
    }
    return $datos;
}

function clave(string $valor, string $secreto): string
{
    return hash_hmac('sha256', $valor, $secreto);
}

function origenPermitido(array $servidor, array $permitidos): bool
{
    $origen = $servidor['HTTP_ORIGIN'] ?? '';
    if ($origen === '' && isset($servidor['HTTP_REFERER'])) {
        $partes = parse_url($servidor['HTTP_REFERER']);
        if (is_array($partes) && isset($partes['scheme'], $partes['host'])) {
            $origen = $partes['scheme'] . '://' . $partes['host'] . (isset($partes['port']) ? ':' . $partes['port'] : '');
        }
    }
    return in_array($origen, $permitidos, true) &&
        !in_array($servidor['HTTP_SEC_FETCH_SITE'] ?? '', ['cross-site', 'same-site'], true);
}

function ipCliente(array $servidor): string
{
    // No confiar en X-Forwarded-For: un visitante puede inventarlo. El hosting
    // debe resolver REMOTE_ADDR si usa un proxy de confianza.
    $ip = $servidor['REMOTE_ADDR'] ?? '';
    if (!filter_var($ip, FILTER_VALIDATE_IP)) throw new \RuntimeException('IP no disponible');
    $binario = inet_pton($ip);
    return strlen($binario) === 16 ? bin2hex(substr($binario, 0, 8)) . '/64' : $ip;
}
