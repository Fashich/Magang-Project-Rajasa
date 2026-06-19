const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
};

async function parseJsonResponse(response) {
  const data = await response.json().catch(() => ({
    success: false,
    message: 'Response bukan JSON valid.',
    errors: {},
  }));

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

export async function loginDev({ username, password }) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ username, password }),
  });

  return parseJsonResponse(response);
}

export async function fetchRombelOptions({ token }) {
  const response = await fetch('/api/rombel/options', {
    method: 'GET',
    headers: {
      ...JSON_HEADERS,
      Authorization: `Bearer ${token}`,
    },
  });

  return parseJsonResponse(response);
}

export async function checkPresensiSessionWarning({ token, modePresensi, rombelId, jamIds, ruangPilihan }) {
  const body = {
    mode_presensi: modePresensi,
    jam_ids: jamIds,
    ruang_pilihan: ruangPilihan,
  };

  if (modePresensi === 'rombel') {
    body.rombel_id = Number(rombelId);
  }

  const response = await fetch('/api/presensi/sesi/check-warning', {
    method: 'POST',
    headers: {
      ...JSON_HEADERS,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  return parseJsonResponse(response);
}

export async function createPresensiSession({ token, modePresensi, rombelId, jamIds, ruangPilihan }) {
  const body = {
    mode_presensi: modePresensi,
    jam_ids: jamIds,
    ruang_pilihan: ruangPilihan,
  };

  if (modePresensi === 'rombel') {
    body.rombel_id = Number(rombelId);
  }

  const response = await fetch('/api/presensi/sesi', {
    method: 'POST',
    headers: {
      ...JSON_HEADERS,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  return parseJsonResponse(response);
}

export async function submitQrScan({ token, presensiSesiId, payloadRaw }) {
  const response = await fetch('/api/presensi/scan', {
    method: 'POST',
    headers: {
      ...JSON_HEADERS,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      presensi_sesi_id: Number(presensiSesiId),
      payload_raw: payloadRaw,
    }),
  });

  return parseJsonResponse(response);
}

export async function fetchPresensiAudit({ token }) {
  const response = await fetch('/api/presensi/audit/latest', {
    method: 'GET',
    headers: {
      ...JSON_HEADERS,
      Authorization: `Bearer ${token}`,
    },
  });

  return parseJsonResponse(response);
}

export async function heartbeatPresensiSession({ token, presensiSesiId }) {
  const response = await fetch(`/api/presensi/sesi/${presensiSesiId}/heartbeat`, {
    method: 'POST',
    headers: { ...JSON_HEADERS, Authorization: `Bearer ${token}` },
  });

  return parseJsonResponse(response);
}

export async function finishPresensiSession({ token, presensiSesiId }) {
  const response = await fetch(`/api/presensi/sesi/${presensiSesiId}/finish`, {
    method: 'POST',
    headers: { ...JSON_HEADERS, Authorization: `Bearer ${token}` },
  });

  return parseJsonResponse(response);
}