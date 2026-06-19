<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Services;

final class QrPayloadService
{
    public function parse(string $payloadRaw): array
    {
        $payloadRaw = trim($payloadRaw);

        if ($payloadRaw === '') {
            return $this->emptyParsedPayload($payloadRaw);
        }

        if ($this->isGoogleFormPayload($payloadRaw)) {
            return $this->parseGoogleFormPayload($payloadRaw);
        }

        return $this->parsePlainPayload($payloadRaw);
    }

    public function normalizePayload(string $value): string
    {
        return strtolower(preg_replace('/[^a-z0-9]+/i', '', $value) ?? '');
    }

    private function isGoogleFormPayload(string $payloadRaw): bool
    {
        $query = parse_url($payloadRaw, PHP_URL_QUERY);

        if (!is_string($query) || $query === '') {
            return false;
        }

        $params = $this->parseQueryPreserveDots($query);

        foreach (array_keys($params) as $key) {
            if (preg_match('/^entry\.\d+$/', (string) $key) === 1) {
                return true;
            }
        }

        return false;
    }

    private function parseGoogleFormPayload(string $payloadRaw): array
    {
        $query = parse_url($payloadRaw, PHP_URL_QUERY);

        if (!is_string($query) || $query === '') {
            return $this->emptyParsedPayload($payloadRaw);
        }

        $params = $this->parseQueryPreserveDots($query);
        $entries = $this->extractGoogleFormEntries($params);

        $nama = '';
        $nisn = '';

        foreach ($entries as $value) {
            $cleanValue = trim((string) $value);
            $digitsOnly = preg_replace('/\D+/', '', $cleanValue) ?? '';

            if ($nisn === '' && preg_match('/^\d{8,20}$/', $digitsOnly) === 1) {
                $nisn = $digitsOnly;
                continue;
            }

            if ($nama === '' && preg_match('/[A-Za-z]/', $cleanValue) === 1) {
                $nama = strtoupper($cleanValue);
            }
        }

        $nama = substr($nama, 0, 120);

        return [
            'payload_raw' => $payloadRaw,
            'payload_normalized' => $this->normalizePayload($nama . $nisn),
            'payload_nisn' => $nisn,
            'payload_nama' => $nama,
        ];
    }

    private function parsePlainPayload(string $payloadRaw): array
    {
        $nisn = $this->extractNisn($payloadRaw);
        $nama = $this->extractName($payloadRaw, $nisn);
        $nama = substr($nama, 0, 120);

        return [
            'payload_raw' => $payloadRaw,
            'payload_normalized' => $this->normalizePayload($nama . $nisn),
            'payload_nisn' => $nisn,
            'payload_nama' => $nama,
        ];
    }

    private function extractGoogleFormEntries(array $params): array
    {
        $entries = [];

        foreach ($params as $key => $value) {
            if (preg_match('/^entry\.\d+$/', (string) $key) === 1) {
                $entries[] = $value;
            }
        }

        return $entries;
    }

    private function parseQueryPreserveDots(string $query): array
    {
        $params = [];

        foreach (explode('&', $query) as $pair) {
            if ($pair === '') {
                continue;
            }

            [$key, $value] = array_pad(explode('=', $pair, 2), 2, '');

            $params[urldecode($key)] = urldecode($value);
        }

        return $params;
    }

    private function extractNisn(string $payloadRaw): string
    {
        if (preg_match('/\b(\d{8,20})\b/', $payloadRaw, $match)) {
            return $match[1];
        }

        return '';
    }

    private function extractName(string $payloadRaw, string $nisn): string
    {
        $name = $payloadRaw;

        if ($nisn !== '') {
            $name = str_replace($nisn, '', $name);
        }

        $name = preg_replace('/[\|\;\,]+/', ' ', $name) ?? '';
        $name = preg_replace('/\s+/', ' ', $name) ?? '';

        return strtoupper(trim($name));
    }

    private function emptyParsedPayload(string $payloadRaw): array
    {
        return [
            'payload_raw' => $payloadRaw,
            'payload_normalized' => $this->normalizePayload($payloadRaw),
            'payload_nisn' => '',
            'payload_nama' => '',
        ];
    }
}