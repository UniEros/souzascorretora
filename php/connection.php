<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$host = 'sql210.infinityfree.com';
$db   = 'if0_41801169_souzascorretora';
$user = 'if0_41801169';
$pass = 'souzasPI2026';

$dsn = "mysql:host=$host;dbname=$db";

try {
    $pdo = new PDO($dsn, $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

} catch (\PDOException $e) {
    echo "Erro na conexão: " . $e->getMessage();
}
?>