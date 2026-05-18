<?php

declare(strict_types=1);

function sendJson(int $statusCode, array $payload): never
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function allowCors(array $methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']): void
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
        'http://www.plandecine.com',
        'https://www.plandecine.com',
    ];

    $host = $_SERVER['HTTP_HOST'] ?? '';
    if ($host !== '') {
        $allowedOrigins[] = 'http://' . $host;
        $allowedOrigins[] = 'https://' . $host;
    }

    if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
        header('Access-Control-Allow-Credentials: true');
    }

    header('Access-Control-Allow-Methods: ' . implode(', ', $methods));
    header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
}

function envValue(string $key): ?string
{
    $envFiles = [
        dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . '.env',
        dirname(__DIR__) . DIRECTORY_SEPARATOR . '.env',
    ];

    foreach ($envFiles as $envFile) {
        if (!is_file($envFile) || !is_readable($envFile)) {
            continue;
        }

        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) {
            continue;
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
    }

    $value = getenv($key);
    return $value === false ? null : $value;
}

function readJsonBody(): array
{
    $rawBody = file_get_contents('php://input');
    if ($rawBody === false || trim($rawBody) === '') {
        return [];
    }

    $decoded = json_decode($rawBody, true);
    return is_array($decoded) ? $decoded : [];
}

function requestMethod(): string
{
    return strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
}

function db(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = envValue('DB_HOST') ?: '127.0.0.1';
    $port = envValue('DB_PORT') ?: '3306';
    $database = envValue('DB_NAME');
    $username = envValue('DB_USER');
    $password = envValue('DB_PASSWORD') ?: (envValue('DB_PASS') ?: '');
    $charset = envValue('DB_CHARSET') ?: 'utf8mb4';

    if (!$database || !$username) {
        sendJson(500, [
            'message' => 'Faltan las variables DB_NAME o DB_USER en .env.',
        ]);
    }

    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=%s', $host, $port, $database, $charset);

    try {
        $pdo = new PDO($dsn, $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (Throwable $exception) {
        sendJson(500, [
            'message' => 'No se pudo conectar con MySQL.',
            'error' => $exception->getMessage(),
        ]);
    }

    return $pdo;
}

function normalizeBool(mixed $value): bool
{
    return filter_var($value, FILTER_VALIDATE_BOOL);
}

function normalizeArray(mixed $value): array
{
    return is_array($value) ? $value : [];
}

function sendEmail(string $toEmail, string $subject, string $textBody, ?string $htmlBody = null): array
{
    $mailFrom = envValue('MAIL_FROM') ?: 'MoviMood <no-reply@movimood.local>';
    $resendApiKey = envValue('RESEND_API_KEY');

    if (is_string($resendApiKey) && trim($resendApiKey) !== '' && function_exists('curl_init')) {
        $payload = [
            'from' => $mailFrom,
            'to' => [$toEmail],
            'subject' => $subject,
            'text' => $textBody,
        ];

        if (is_string($htmlBody) && trim($htmlBody) !== '') {
            $payload['html'] = $htmlBody;
        }

        $ch = curl_init('https://api.resend.com/emails');
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . trim($resendApiKey),
                'Content-Type: application/json',
            ],
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_TIMEOUT => 15,
        ]);

        $rawResponse = curl_exec($ch);
        $curlError = curl_error($ch);
        $statusCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($curlError === '' && $statusCode >= 200 && $statusCode < 300) {
            return [
                'sent' => true,
                'provider' => 'resend',
                'statusCode' => $statusCode,
            ];
        }

        return [
            'sent' => false,
            'provider' => 'resend',
            'statusCode' => $statusCode,
            'error' => $curlError !== '' ? $curlError : (string) $rawResponse,
        ];
    }

    $headers = 'From: ' . $mailFrom . "\r\n" .
        'Reply-To: ' . $mailFrom . "\r\n" .
        'X-Mailer: PHP/' . phpversion();
    $mailSent = @mail($toEmail, $subject, $textBody, $headers);

    return [
        'sent' => $mailSent,
        'provider' => 'php-mail',
    ];
}
