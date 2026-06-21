<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    $pdo = new PDO('mysql:host=db;port=3306;dbname=sistem_presensi_siswa_qr', 'root', 'root');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "DB OK\n";

    // Test queries
    $total = $pdo->query("SELECT COUNT(*) FROM siswa WHERE status = 'aktif'")->fetchColumn();
    echo "Total siswa aktif: $total\n";

    $rombel = $pdo->query("SELECT COUNT(*) FROM rombel WHERE status = 'aktif'")->fetchColumn();
    echo "Total rombel: $rombel\n";

    $sesi = $pdo->query("SELECT COUNT(*) FROM presensi_sesi WHERE status IN ('aktif','suspended')")->fetchColumn();
    echo "Sesi aktif: $sesi\n";

    echo "\nSemua query OK!\n";

    // Test container resolution - check if PDO is injectable
    require_once '/var/www/vendor/autoload.php';
    echo "Autoload OK\n";

    // Check if AdminDashboardController exists
    $class = 'Rajasa\\PresensiSiswa\\Http\\Controllers\\AdminDashboardController';
    if (class_exists($class)) {
        echo "AdminDashboardController class exists OK\n";
    } else {
        echo "AdminDashboardController class NOT FOUND\n";
    }

} catch (Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo $e->getTraceAsString() . "\n";
}
