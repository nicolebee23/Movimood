<?php

declare(strict_types=1);

// Desactivar compresión de salida a nivel PHP y Apache
// Hostinger puede recomprimir la respuesta; esto lo evita.
ini_set('zlib.output_compression', '0');
ini_set('zlib.output_compression_level', '0');
if (function_exists('apache_setenv')) {
    apache_setenv('no-gzip', '1');
}
if (ob_get_level()) {
    ob_end_clean();
}

function sendJson(int $statusCode, array $payload): never
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    header('Content-Encoding: identity');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function allowCors(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowedOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
        'http://localhost:3002',
        'http://127.0.0.1:3002',
        'http://localhost',
        'http://127.0.0.1',
        'http://movimood.plandecine.com',
        'https://movimood.plandecine.com',
        'http://www.movimood.plandecine.com',
        'https://www.movimood.plandecine.com',
        'http://plandecine.com',
        'https://plandecine.com',
    ];

    if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
    }

    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

function loadEnvValue(string $key): ?string
{
    $envFile = dirname(__DIR__) . DIRECTORY_SEPARATOR . '.env';

    if (!is_file($envFile) || !is_readable($envFile)) {
        return getenv($key) ?: null;
    }

    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return getenv($key) ?: null;
    }

    foreach ($lines as $line) {
        $trimmed = trim($line);

        if ($trimmed === '' || str_starts_with($trimmed, '#') || !str_contains($trimmed, '=')) {
            continue;
        }

        [$currentKey, $value] = explode('=', $trimmed, 2);
        if (trim($currentKey) !== $key) {
            continue;
        }

        return trim($value, " \t\n\r\0\x0B\"");
    }

    return getenv($key) ?: null;
}

function buildTmdbSearchUrl(string $apiKey): string
{
    $query = trim((string) ($_GET['query'] ?? ''));
    if ($query === '') {
        sendJson(400, ['message' => 'Falta el parametro query.']);
    }

    $page         = max(1, min(20, (int) ($_GET['page'] ?? 1)));
    $language     = trim((string) ($_GET['language'] ?? 'es-ES')) ?: 'es-ES';
    $includeAdult = ((string) ($_GET['include_adult'] ?? 'false')) === 'true' ? 'true' : 'false';

    $params = [
        'api_key'       => $apiKey,
        'query'         => $query,
        'page'          => (string) $page,
        'language'      => $language,
        'include_adult' => $includeAdult,
    ];

    return 'https://api.themoviedb.org/3/search/movie?' . http_build_query($params);
}

// --- Bootstrap ---

allowCors();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    sendJson(405, ['message' => 'Metodo no permitido.']);
}

$apiKey = loadEnvValue('TMDB_API_KEY');
if ($apiKey === null || $apiKey === '') {
    sendJson(500, ['message' => 'TMDB_API_KEY no esta configurada en el servidor.']);
}

$tmdbUrl = buildTmdbSearchUrl($apiKey);

// --- Petición a TMDB con curl (descomprime gzip automáticamente) ---

$ch = curl_init($tmdbUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_ENCODING       => '',       // acepta y descomprime gzip/deflate
    CURLOPT_TIMEOUT        => 15,
    CURLOPT_USERAGENT      => 'MoviMood/1.0',
    CURLOPT_HEADER         => false,
]);

$responseBody = curl_exec($ch);
$statusCode   = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError    = curl_error($ch);
curl_close($ch);

if ($responseBody === false || $curlError !== '') {
    sendJson(502, ['message' => 'No se pudo contactar con TMDB.']);
}

// --- Respuesta sin compresión ---

http_response_code($statusCode);
header('Content-Type: application/json; charset=utf-8');
header('Content-Encoding: identity');
echo $responseBody;