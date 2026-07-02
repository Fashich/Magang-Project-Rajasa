<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Services;

use Rajasa\PresensiSiswa\Support\Env;

/**
 * FileStorageService
 *
 * Klien S3-compatible minimal untuk Cloudflare R2 (tanpa dependency aws-sdk-php
 * yang berat). Mengimplementasikan AWS Signature Version 4 secara manual
 * menggunakan cURL murni.
 *
 * Kenapa R2? Free tier 10GB storage + tanpa biaya egress, cocok untuk
 * menyimpan file kalender akademik dan foto profil yang perlu persisten
 * meskipun container Render di-redeploy.
 *
 * ENV yang dibutuhkan:
 *   R2_ACCOUNT_ID     = ID akun Cloudflare
 *   R2_ACCESS_KEY_ID  = Access key R2 API token
 *   R2_SECRET_KEY     = Secret key R2 API token
 *   R2_BUCKET         = Nama bucket (contoh: presensi-rajasa-files)
 *   R2_PUBLIC_URL     = URL publik bucket (contoh: https://pub-xxxx.r2.dev)
 *
 * Jika env di atas tidak diset, service akan fallback ke local disk
 * storage (perilaku lama) — sistem tetap jalan tanpa R2 dikonfigurasi.
 */
final class FileStorageService
{
    private ?string $accountId;
    private ?string $accessKey;
    private ?string $secretKey;
    private ?string $bucket;
    private ?string $publicUrl;
    private bool $enabled;

    public function __construct()
    {
        $this->accountId = Env::get('R2_ACCOUNT_ID');
        $this->accessKey = Env::get('R2_ACCESS_KEY_ID');
        $this->secretKey = Env::get('R2_SECRET_KEY');
        $this->bucket    = Env::get('R2_BUCKET');
        $this->publicUrl = Env::get('R2_PUBLIC_URL');

        $this->enabled = (bool) ($this->accountId && $this->accessKey && $this->secretKey && $this->bucket);
    }

    public function isEnabled(): bool
    {
        return $this->enabled;
    }

    /**
     * Upload file ke R2. Return URL publik jika sukses, null jika R2 tidak dikonfigurasi.
     *
     * @param string $key         path/nama file di bucket, contoh: 'kalender-akademik/2026.pdf'
     * @param string $contents    isi file (binary)
     * @param string $contentType MIME type, contoh: 'application/pdf'
     *
     * @throws \RuntimeException jika upload gagal
     */
    public function put(string $key, string $contents, string $contentType): ?string
    {
        if (!$this->enabled) {
            return null; // caller harus fallback ke local storage
        }

        $endpoint = "https://{$this->accountId}.r2.cloudflarestorage.com";
        $host     = parse_url($endpoint, PHP_URL_HOST);
        $path     = '/' . $this->bucket . '/' . ltrim($key, '/');

        $now       = gmdate('Ymd\THis\Z');
        $dateStamp = gmdate('Ymd');
        $region    = 'auto';
        $service   = 's3';

        $payloadHash = hash('sha256', $contents);

        $headers = [
            'host'                 => $host,
            'x-amz-content-sha256' => $payloadHash,
            'x-amz-date'           => $now,
            'content-type'         => $contentType,
        ];
        ksort($headers);

        $canonicalHeaders = '';
        $signedHeadersArr = [];
        foreach ($headers as $k => $v) {
            $canonicalHeaders .= "{$k}:{$v}\n";
            $signedHeadersArr[] = $k;
        }
        $signedHeaders = implode(';', $signedHeadersArr);

        $canonicalRequest = implode("\n", [
            'PUT',
            $path,
            '', // query string kosong
            $canonicalHeaders,
            $signedHeaders,
            $payloadHash,
        ]);

        $credentialScope = "{$dateStamp}/{$region}/{$service}/aws4_request";
        $stringToSign = implode("\n", [
            'AWS4-HMAC-SHA256',
            $now,
            $credentialScope,
            hash('sha256', $canonicalRequest),
        ]);

        $signingKey = $this->getSignatureKey($dateStamp, $region, $service);
        $signature  = hash_hmac('sha256', $stringToSign, $signingKey);

        $authHeader = sprintf(
            'AWS4-HMAC-SHA256 Credential=%s/%s, SignedHeaders=%s, Signature=%s',
            $this->accessKey,
            $credentialScope,
            $signedHeaders,
            $signature
        );

        $ch = curl_init("{$endpoint}{$path}");
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST  => 'PUT',
            CURLOPT_POSTFIELDS     => $contents,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => [
                "Authorization: {$authHeader}",
                "x-amz-date: {$now}",
                "x-amz-content-sha256: {$payloadHash}",
                "Content-Type: {$contentType}",
            ],
            CURLOPT_TIMEOUT        => 30,
        ]);

        $response   = curl_exec($ch);
        $httpCode   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError  = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            throw new \RuntimeException("R2 upload gagal (cURL): {$curlError}");
        }

        if ($httpCode < 200 || $httpCode >= 300) {
            throw new \RuntimeException("R2 upload gagal (HTTP {$httpCode}): {$response}");
        }

        $publicBase = rtrim($this->publicUrl ?? '', '/');
        return "{$publicBase}/{$key}";
    }

    /**
     * Hapus file dari R2.
     */
    public function delete(string $key): bool
    {
        if (!$this->enabled) {
            return false;
        }

        $endpoint = "https://{$this->accountId}.r2.cloudflarestorage.com";
        $host     = parse_url($endpoint, PHP_URL_HOST);
        $path     = '/' . $this->bucket . '/' . ltrim($key, '/');

        $now       = gmdate('Ymd\THis\Z');
        $dateStamp = gmdate('Ymd');
        $region    = 'auto';
        $service   = 's3';
        $payloadHash = hash('sha256', '');

        $headers = [
            'host'                 => $host,
            'x-amz-content-sha256' => $payloadHash,
            'x-amz-date'           => $now,
        ];
        ksort($headers);

        $canonicalHeaders = '';
        $signedHeadersArr = [];
        foreach ($headers as $k => $v) {
            $canonicalHeaders .= "{$k}:{$v}\n";
            $signedHeadersArr[] = $k;
        }
        $signedHeaders = implode(';', $signedHeadersArr);

        $canonicalRequest = implode("\n", ['DELETE', $path, '', $canonicalHeaders, $signedHeaders, $payloadHash]);
        $credentialScope  = "{$dateStamp}/{$region}/{$service}/aws4_request";
        $stringToSign     = implode("\n", ['AWS4-HMAC-SHA256', $now, $credentialScope, hash('sha256', $canonicalRequest)]);
        $signingKey       = $this->getSignatureKey($dateStamp, $region, $service);
        $signature        = hash_hmac('sha256', $stringToSign, $signingKey);

        $authHeader = sprintf(
            'AWS4-HMAC-SHA256 Credential=%s/%s, SignedHeaders=%s, Signature=%s',
            $this->accessKey, $credentialScope, $signedHeaders, $signature
        );

        $ch = curl_init("{$endpoint}{$path}");
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST  => 'DELETE',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => [
                "Authorization: {$authHeader}",
                "x-amz-date: {$now}",
                "x-amz-content-sha256: {$payloadHash}",
            ],
            CURLOPT_TIMEOUT => 30,
        ]);
        curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return $httpCode >= 200 && $httpCode < 300;
    }

    private function getSignatureKey(string $dateStamp, string $region, string $service): string
    {
        $kSecret  = 'AWS4' . $this->secretKey;
        $kDate    = hash_hmac('sha256', $dateStamp, $kSecret, true);
        $kRegion  = hash_hmac('sha256', $region, $kDate, true);
        $kService = hash_hmac('sha256', $service, $kRegion, true);
        return hash_hmac('sha256', 'aws4_request', $kService, true);
    }
}
