<?php
require_once __DIR__ . '/_lib/bootstrap.php';
$email = "nicol@example.com"; // Let's just use a dummy one to see if resend API accepts it or throws error
$res = sendEmail($email, "Test", "Test body");
var_dump($res);
