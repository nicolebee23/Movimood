<?php
// Simple newsletter subscription endpoint
// Use bootstrap helper for env and email sending
require_once __DIR__ . '/_lib/bootstrap.php';

// Ensure no PHP warnings/errors or stray output break the JSON response
ini_set('display_errors', 0);
// Disable zlib output compression for this script to avoid sending binary gzipped body
@ini_set('zlib.output_compression', '0');
// Force explicit identity encoding so clients don't receive undecoded compressed bytes
header('Content-Encoding: identity');
header('Content-Type: application/json; charset=utf-8');

// Clear any existing output buffers to avoid stray characters (BOM, whitespace)
while (ob_get_level()) {
    ob_end_clean();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

$email = isset($_POST['email']) ? trim($_POST['email']) : '';
if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email inválido']);
    exit;
}

$storage = __DIR__ . '/newsletter_subscribers.txt';
try {
    // ensure file exists
    if (!is_file($storage)) {
        file_put_contents($storage, '', LOCK_EX);
    }

    // avoid duplicates
    $existing = file($storage, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $emails = [];
    foreach ($existing as $line) {
        $parts = explode("\t", $line);
        $e = trim($parts[count($parts)-1] ?? '');
        if ($e !== '') $emails[] = $e;
    }

    if (!in_array($email, $emails, true)) {
        $line = date('c') . "\t" . $email . "\n";
        file_put_contents($storage, $line, FILE_APPEND | LOCK_EX);
    }

    // send confirmation email
    $subject = 'MoviMood — Confirmación de suscripción';
    $text = "Gracias por suscribirte a MoviMood!\n\nRecibirás novedades por correo cuando publiquemos actualizaciones.";
    $html = "<p>Gracias por suscribirte a <strong>MoviMood</strong>!</p><p>Recibirás novedades por correo cuando publiquemos actualizaciones.</p>";

    $mailRes = sendEmail($email, $subject, $text, $html);

    // Sanitize mail response to avoid injecting non-UTF8/binary data into JSON
    $sanitizedMail = [
        'sent' => isset($mailRes['sent']) ? (bool) $mailRes['sent'] : false,
        'provider' => isset($mailRes['provider']) ? (string) $mailRes['provider'] : '',
    ];

    if (isset($mailRes['statusCode'])) {
        $sanitizedMail['statusCode'] = (int) $mailRes['statusCode'];
    }
    if (isset($mailRes['error']) && $mailRes['error'] !== null) {
        // ensure error is a UTF-8 string
        $err = is_string($mailRes['error']) ? $mailRes['error'] : json_encode($mailRes['error']);
        $sanitizedMail['error'] = mb_convert_encoding($err, 'UTF-8', 'UTF-8');
    }

    $response = ['success' => true, 'emailSaved' => true, 'mail' => $sanitizedMail];
    $json = json_encode($response, JSON_UNESCAPED_UNICODE);
    // ensure content-length matches the actual output
    header('Content-Length: ' . strlen($json));
    echo $json;
} catch (Exception $e) {
    http_response_code(500);
    $resp = ['success' => false, 'message' => 'No se pudo guardar'];
    $json = json_encode($resp, JSON_UNESCAPED_UNICODE);
    header('Content-Length: ' . strlen($json));
    echo $json;
}
