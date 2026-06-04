<?php

declare(strict_types=1);

function sendJson(int $statusCode, array $payload): never
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
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

function buildTmdbMovieUrl(string $apiKey): string
{
    $movieId = trim((string) ($_GET['id'] ?? ''));
    if ($movieId === '' || !is_numeric($movieId)) {
        sendJson(400, ['message' => 'Falta el parametro id o no es valido.']);
    }

    $language = trim((string) ($_GET['language'] ?? 'es-ES')) ?: 'es-ES';

    $params = [
        'api_key' => $apiKey,
        'language' => $language,
    ];

    // Request credits so the frontend can access director/crew information
    $params['append_to_response'] = 'credits';

    return 'https://api.themoviedb.org/3/movie/' . $movieId . '?' . http_build_query($params);
}

function decodeTmdbBody(string $body): string
{
    $candidates = [$body];

    if (function_exists('gzdecode')) {
        $decoded = @gzdecode($body);
        if (is_string($decoded) && $decoded !== '') {
            $candidates[] = $decoded;
        }
    }

    if (function_exists('gzuncompress')) {
        $decoded = @gzuncompress($body);
        if (is_string($decoded) && $decoded !== '') {
            $candidates[] = $decoded;
        }
    }

    if (function_exists('gzinflate')) {
        $decoded = @gzinflate($body);
        if (is_string($decoded) && $decoded !== '') {
            $candidates[] = $decoded;
        }
    }

    if (function_exists('zlib_decode')) {
        $decoded = @zlib_decode($body);
        if (is_string($decoded) && $decoded !== '') {
            $candidates[] = $decoded;
        }
    }

    foreach ($candidates as $candidate) {
        json_decode($candidate, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            return $candidate;
        }
    }

    return $body;
}

function fetchTmdbMovieResponse(string $url): array
{
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        if ($ch !== false) {
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_TIMEOUT => 15,
                CURLOPT_CONNECTTIMEOUT => 10,
                CURLOPT_ENCODING => '',
                CURLOPT_HTTPHEADER => [
                    'Accept: application/json',
                    'Accept-Encoding: identity',
                ],
                CURLOPT_USERAGENT => 'MoviMood/1.0',
            ]);

            $body = curl_exec($ch);
            if ($body !== false) {
                $statusCode = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
                curl_close($ch);
                return [$statusCode > 0 ? $statusCode : 200, $body];
            }

            curl_close($ch);
        }
    }

    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'ignore_errors' => true,
            'timeout' => 15,
            'header' => "Accept: application/json\r\nAccept-Encoding: identity\r\n",
        ],
    ]);

    $body = @file_get_contents($url, false, $context);
    if ($body === false) {
        return [502, false];
    }

    $statusLine = $http_response_header[0] ?? 'HTTP/1.1 502 Bad Gateway';
    preg_match('/\s(\d{3})\s/', $statusLine, $matches);
    $statusCode = isset($matches[1]) ? (int) $matches[1] : 502;

    return [$statusCode, $body];
}

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

$tmdbUrl = buildTmdbMovieUrl($apiKey);
$response = fetchTmdbMovieResponse($tmdbUrl);
[$statusCode, $responseBody] = $response;

if ($responseBody === false) {
    sendJson(502, ['message' => 'No se pudo contactar con TMDB.']);
}
// TMDB may return compressed bytes without a reliable encoding header in this
// hosting environment. Decode to plain JSON before returning it to the client.
$decodedBody = decodeTmdbBody((string) $responseBody);

if (json_decode($decodedBody, true) === null && json_last_error() !== JSON_ERROR_NONE) {
    sendJson(502, ['message' => 'La respuesta de TMDB no pudo decodificarse correctamente.']);
}

http_response_code($statusCode);
header('Content-Type: application/json; charset=utf-8');
header('Content-Encoding: identity');
echo $decodedBody;
