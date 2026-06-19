<?php
$pdo = new PDO('mysql:host=db;port=3306;dbname=sistem_presensi_siswa_qr', 'root', 'root');
$hash = password_hash('Rajasa@123', PASSWORD_BCRYPT);
$stmt = $pdo->prepare('UPDATE users SET password_hash = ? WHERE username = ?');
$stmt->execute([$hash, 'siswa']);
echo 'Updated: ' . $stmt->rowCount() . PHP_EOL;
echo 'Hash: ' . $hash . PHP_EOL;
