<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Services;

use Illuminate\Database\Capsule\Manager as DB;

final class PermissionService
{
    public function rolesForUser(int $userId): array
    {
        $rows = DB::table('user_roles as ur')
            ->join('roles as r', 'r.role_id', '=', 'ur.role_id')
            ->where('ur.user_id', $userId)
            ->where('ur.is_active', 1)
            ->select('r.*')
            ->get();

        return $rows
            ->map(fn ($row) => $this->roleKey((array) $row))
            ->filter()
            ->values()
            ->all();
    }

    public function permissionsForUser(int $userId): array
    {
        $rolePermissions = DB::table('user_roles as ur')
            ->join('role_permissions as rp', 'rp.role_id', '=', 'ur.role_id')
            ->join('permissions as p', 'p.perm_id', '=', 'rp.perm_id')
            ->where('ur.user_id', $userId)
            ->where('ur.is_active', 1)
            ->select('p.*')
            ->get()
            ->map(fn ($row) => $this->permissionKey((array) $row))
            ->filter()
            ->values()
            ->all();

        $customPermissions = DB::table('user_permissions as up')
            ->join('permissions as p', 'p.perm_id', '=', 'up.perm_id')
            ->where('up.user_id', $userId)
            ->where('up.is_allowed', 1)
            ->where(function ($query): void {
                $query->whereNull('up.valid_until')
                    ->orWhere('up.valid_until', '>', date('Y-m-d H:i:s'));
            })
            ->select('p.*')
            ->get()
            ->map(fn ($row) => $this->permissionKey((array) $row))
            ->filter()
            ->values()
            ->all();

        return array_values(array_unique(array_merge($rolePermissions, $customPermissions)));
    }

    public function has(int $userId, string $permission): bool
    {
        return in_array($permission, $this->permissionsForUser($userId), true);
    }

    private function permissionKey(array $row): ?string
    {
        return $row['perm_slug']
            ?? $row['permission_key']
            ?? $row['perm_key']
            ?? $row['permission_slug']
            ?? $row['permission_name']
            ?? $row['nama_permission']
            ?? null;
    }

    private function roleKey(array $row): ?string
    {
        return $row['nama_role']
            ?? $row['role_slug']
            ?? $row['role_key']
            ?? $row['role_name']
            ?? null;
    }
}