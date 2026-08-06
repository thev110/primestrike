// ─── Zoom API helper (Server-to-Server OAuth) ──────────────────────────────
// Server-only. NEVER import into a client component.
//
// Setup required (once, on the Zoom account used for classes):
//   1. https://marketplace.zoom.us → Build App → Server-to-Server OAuth
//   2. Scopes needed: meeting:write:admin, meeting:read:admin, user:read:admin
//   3. Add env vars:
//        ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET, ZOOM_ACCOUNT_ID
//        ZOOM_HOST_EMAIL (optional — the host whose calendar creates meetings;
//                         defaults to the account's "me" user)
//
// Server-to-Server OAuth grants the account access token via the
// account_credentials grant. JWT apps are deprecated by Zoom.

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

let _token: CachedToken | null = null;

export function isZoomConfigured(): boolean {
  return !!(
    process.env.ZOOM_CLIENT_ID &&
    process.env.ZOOM_CLIENT_SECRET &&
    process.env.ZOOM_ACCOUNT_ID
  );
}

async function getZoomToken(): Promise<string> {
  if (_token && _token.expiresAt > Date.now() + 60_000) {
    return _token.accessToken;
  }

  const clientId = process.env.ZOOM_CLIENT_ID || "";
  const clientSecret = process.env.ZOOM_CLIENT_SECRET || "";
  const accountId = process.env.ZOOM_ACCOUNT_ID || "";

  if (!clientId || !clientSecret || !accountId) {
    throw new Error(
      "Zoom API not configured. Set ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET and ZOOM_ACCOUNT_ID in your environment."
    );
  }

  // Official flow: send client_id:client_secret base64-encoded as Basic auth,
  // with the account_credentials grant in the body.
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "account_credentials",
    account_id: accountId,
  });

  const res = await fetch("https://zoom.us/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Zoom OAuth token request failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in?: number };
  _token = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  };
  return _token.accessToken;
}

interface ZoomApiErrorBody {
  code?: number;
  message?: string;
}

async function zoomFetch(path: string, options: RequestInit = {}): Promise<unknown> {
  const token = await getZoomToken();
  const res = await fetch(`https://api.zoom.us/v2${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const body = (data as ZoomApiErrorBody) || {};
    const detail = typeof data === "string" ? data : body.message || JSON.stringify(data).slice(0, 400);
    const err = new Error(
      `Zoom API ${options.method || "GET"} ${path} failed (${res.status}): ${detail}`
    ) as Error & { status?: number; code?: number };
    err.status = res.status;
    if (typeof body.code === "number") err.code = body.code;
    throw err;
  }

  return data;
}

export interface ZoomMeetingInfo {
  meetingId: string; // Zoom numeric meeting id as a string
  uuid: string;
  startUrl: string; // host-only "start meeting" link
  joinUrl: string; // generic join link
  password: string | null;
}

// Create a scheduled meeting with registration enabled (each student gets a
// PERSONAL join link) and the waiting room forced on, so the host manually
// admits every participant — the two layers that stop code sharing.
export async function createRegisteredMeeting(opts: {
  topic: string;
  startTimeIso: string; // RFC3339 UTC, e.g. "2026-08-10T04:30:00.000Z"
  durationMinutes: number;
}): Promise<ZoomMeetingInfo> {
  const userId = process.env.ZOOM_HOST_EMAIL || "me";
  const data = (await zoomFetch(`/users/${encodeURIComponent(userId)}/meetings`, {
    method: "POST",
    body: JSON.stringify({
      topic: opts.topic,
      type: 2, // scheduled meeting
      start_time: opts.startTimeIso,
      duration: opts.durationMinutes,
      timezone: "Asia/Kolkata",
      settings: {
        approval_type: 0, // registrations auto-approved (we only register enrolled students)
        registrants_email_notification: false,
        host_video: true,
        participant_video: true,
        join_before_host: false,
        waiting_room: true, // host must admit everyone manually
        mute_upon_entry: true,
        meeting_authentication: false,
      },
    }),
  })) as {
    id: number;
    uuid: string;
    start_url: string;
    join_url: string;
    password?: string;
  };

  return {
    meetingId: String(data.id),
    uuid: data.uuid,
    startUrl: data.start_url,
    joinUrl: data.join_url,
    password: data.password || null,
  };
}

export interface ZoomRegistrantInfo {
  registrantId: string;
  joinUrl: string;
  status: string;
}

interface ZoomRegistrantApiRow {
  id: string;
  email: string;
  first_name?: string;
  join_url: string;
  status: string;
}

// Register one attendee and return their unique personal join link.
// If the email is already registered, we reuse the existing link instead of erroring.
export async function addRegistrant(
  meetingId: string,
  opts: { email: string; firstName: string; lastName?: string }
): Promise<ZoomRegistrantInfo> {
  try {
    const data = (await zoomFetch(`/meetings/${meetingId}/registrants`, {
      method: "POST",
      body: JSON.stringify({
        email: opts.email,
        first_name: opts.firstName,
        last_name: opts.lastName || "",
        auto_approve: true,
      }),
    })) as { id: string; join_url: string; status: string };
    return {
      registrantId: data.id,
      joinUrl: data.join_url,
      status: data.status,
    };
  } catch (err) {
    // Only treat this as a duplicate-registration case (reuse the existing
    // personal link). Other failures — rate limits, auth, network — rethrow
    // immediately so we don't pile extra API calls on top of them.
    const zoomErr = err as Error & { code?: number };
    const message = zoomErr.message || "";
    const isDuplicate =
      zoomErr.code === 3001 ||
      zoomErr.code === 1005 ||
      /already registered/i.test(message);
    if (!isDuplicate) throw err;

    const existing = await findRegistrantByEmail(meetingId, opts.email);
    if (existing) return existing;
    throw err;
  }
}

export async function findRegistrantByEmail(
  meetingId: string,
  email: string
): Promise<ZoomRegistrantInfo | null> {
  const data = (await zoomFetch(
    `/meetings/${meetingId}/registrants?page_size=300`
  )) as { registrants?: ZoomRegistrantApiRow[] };
  const found = (data.registrants || []).find(
    (r) => r.email.toLowerCase() === email.toLowerCase()
  );
  return found
    ? { registrantId: found.id, joinUrl: found.join_url, status: found.status }
    : null;
}

