<?php
declare(strict_types=1);
namespace Winforge\Formularios;

function fueraDePublico(string $ruta, string $publico): bool
{
    $ruta = strtolower(str_replace('\\', '/', rtrim($ruta, '/\\')));
    $publico = strtolower(str_replace('\\', '/', rtrim($publico, '/\\')));
    return $ruta !== $publico && !str_starts_with($ruta, $publico . '/');
}

function abrirAlmacen(string $directorio, string $publico): \PDO
{
    $real = realpath($directorio);
    if (!$real || !fueraDePublico($real, $publico) || !is_writable($real)) {
        throw new \RuntimeException('Almacén privado no disponible');
    }
    $ruta = $real . '/formularios.sqlite';
    if (is_link($ruta)) throw new \RuntimeException('Ruta inválida');
    umask(0077);
    $db = new \PDO('sqlite:' . $ruta, null, null, [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION]);
    $db->exec('PRAGMA busy_timeout=5000');
    $db->exec('PRAGMA secure_delete=ON');
    $db->exec('CREATE TABLE IF NOT EXISTS eventos (grupo TEXT NOT NULL, instante INTEGER NOT NULL)');
    $db->exec('CREATE INDEX IF NOT EXISTS eventos_grupo_fecha ON eventos(grupo, instante)');
    $db->exec('CREATE INDEX IF NOT EXISTS eventos_fecha ON eventos(instante)');
    $db->exec('CREATE TABLE IF NOT EXISTS solicitudes (id TEXT PRIMARY KEY, huella TEXT NOT NULL, estado TEXT NOT NULL, instante INTEGER NOT NULL)');
    return $db;
}

function transaccion(\PDO $db, callable $operacion): mixed
{
    $db->exec('BEGIN IMMEDIATE');
    try {
        $resultado = $operacion();
        $db->exec('COMMIT');
        return $resultado;
    } catch (\Throwable $e) {
        $db->exec('ROLLBACK');
        throw $e;
    }
}

function comprobarLimites(\PDO $db, array $reglas, int $ahora): void
{
    $consulta = $db->prepare('SELECT COUNT(*) AS cantidad, MIN(instante) AS primero FROM eventos WHERE grupo = ? AND instante > ?');
    foreach ($reglas as [$grupo, $maximo, $ventana]) {
        $consulta->execute([$grupo, $ahora - $ventana]);
        $fila = $consulta->fetch(\PDO::FETCH_ASSOC);
        if ((int)$fila['cantidad'] >= $maximo) {
            throw new Rechazo(429, 'limite', 'Recibimos varios intentos. Esperá un momento antes de volver a enviar.', [],
                max(1, (int)$fila['primero'] + $ventana - $ahora));
        }
    }
}

function registrarGrupos(\PDO $db, array $grupos, int $ahora): void
{
    $insertar = $db->prepare('INSERT INTO eventos(grupo, instante) VALUES (?, ?)');
    foreach (array_unique($grupos) as $grupo) $insertar->execute([$grupo, $ahora]);
}

function limitarIntentos(\PDO $db, string $ip, int $ahora): void
{
    transaccion($db, function () use ($db, $ip, $ahora) {
        $db->prepare('DELETE FROM eventos WHERE instante <= ?')->execute([$ahora - 86400]);
        $db->prepare('DELETE FROM solicitudes WHERE instante <= ?')->execute([$ahora - 86400]);
        comprobarLimites($db, [['intento:' . $ip, 30, 900], ['intento:global', 600, 900]], $ahora);
        registrarGrupos($db, ['intento:' . $ip, 'intento:global'], $ahora);
    });
}

function reservar(\PDO $db, string $id, string $huella, string $ip, string $email, int $ahora): string
{
    return transaccion($db, function () use ($db, $id, $huella, $ip, $email, $ahora) {
        $consulta = $db->prepare('SELECT huella, estado FROM solicitudes WHERE id = ?');
        $consulta->execute([$id]);
        $anterior = $consulta->fetch(\PDO::FETCH_ASSOC);
        if ($anterior) {
            if (!hash_equals($anterior['huella'], $huella)) {
                throw new Rechazo(409, 'solicitud', 'La solicitud cambió. Recargá la página antes de enviar.');
            }
            if ($anterior['estado'] === 'enviado') return 'repetido';
            throw new Rechazo(409, 'pendiente', 'Este envío ya fue iniciado, pero no pudimos confirmar su resultado. Escribinos a info@winforge.com para evitar duplicarlo.');
        }
        comprobarLimites($db, [
            ['envio:ip:' . $ip, 1, 45], ['envio:ip:' . $ip, 5, 900], ['envio:ip:' . $ip, 30, 86400],
            ['envio:email:' . $email, 3, 900], ['envio:email:' . $email, 6, 86400],
            ['envio:global', 60, 3600], ['envio:global', 300, 86400],
        ], $ahora);
        registrarGrupos($db, ['envio:ip:' . $ip, 'envio:email:' . $email, 'envio:global'], $ahora);
        $db->prepare('INSERT INTO solicitudes(id, huella, estado, instante) VALUES (?, ?, ?, ?)')
            ->execute([$id, $huella, 'pendiente', $ahora]);
        return 'nuevo';
    });
}

function finalizar(\PDO $db, string $id, string $estado): void
{
    $db->prepare('UPDATE solicitudes SET estado = ? WHERE id = ?')->execute([$estado, $id]);
}
