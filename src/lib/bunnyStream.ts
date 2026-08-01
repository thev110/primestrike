import crypto from "crypto";

// Bunny Stream helpers. Server-only — never import into a client component.
//
// Videos live in a Bunny Stream library with MP4 fallback and direct play
// disabled, so the only way to watch is an HLS manifest behind a signed token.
// We mint those tokens here, scoped to a short expiry, after the caller has
// already verified the student holds a live grant.

const API_BASE = "https://api.bunny.net";
const VIDEO_API_BASE = "https://video.bunnycdn.com";

function required(name: string): string {
  const value = process.env[name] || "";
  if (!value) {
    throw new Error(`bunnyStream: ${name} is missing.`);
  }
  return value;
}

export function libraryId(): string {
  return required("BUNNY_STREAM_LIBRARY_ID");
}

export function cdnHostname(): string {
  return required("BUNNY_STREAM_CDN_HOSTNAME");
}

// Signs a Bunny "token authentication" URL. Bunny expects
// sha256_base64(securityKey + path + expires) with a URL-safe alphabet.
// Docs: https://docs.bunny.net/docs/cdn-token-authentication-basic
function signPath(path: string, expires: number): string {
  const key = required("BUNNY_STREAM_TOKEN_KEY");
  const hash = crypto
    .createHash("sha256")
    .update(key + path + expires)
    .digest("base64")
    .replace(/\n/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  return hash;
}

// Signed HLS manifest URL for a given Bunny video GUID.
// ttlSeconds should comfortably exceed the video length so playback does not
// die mid-watch, but stay short enough that a leaked URL expires quickly.
export function signedHlsUrl(bunnyVideoId: string, ttlSeconds = 4 * 60 * 60): string {
  const path = `/${bunnyVideoId}/playlist.m3u8`;
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const token = signPath(path, expires);
  return `https://${cdnHostname()}${path}?token=${token}&expires=${expires}`;
}

// Signed embed URL for Bunny's own player (handles HLS, adaptive bitrate and
// device quirks for us). Bunny signs embeds as sha256(libraryId + key + expires + videoId).
export function signedEmbedUrl(bunnyVideoId: string, ttlSeconds = 4 * 60 * 60): string {
  const key = required("BUNNY_STREAM_TOKEN_KEY");
  const lib = libraryId();
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const token = crypto
    .createHash("sha256")
    .update(key + bunnyVideoId + expires)
    .digest("hex");
  const params = new URLSearchParams({
    token,
    expires: String(expires),
    autoplay: "true",
    preload: "false",
  });
  return `https://iframe.mediadelivery.net/embed/${lib}/${bunnyVideoId}?${params}`;
}

// Presigned credentials for a direct browser-to-Bunny TUS upload.
// Vercel caps request bodies at 4.5MB, so a lecture file can never be routed
// through our own function — the browser must talk to Bunny directly. We only
// mint the signature here; the API key never reaches the client.
// Docs: https://docs.bunny.net/reference/tus-resumable-uploads
export interface TusUploadCredentials {
  endpoint: string;
  libraryId: string;
  videoId: string;
  expire: number;
  signature: string;
}

export function tusCredentials(
  bunnyVideoId: string,
  ttlSeconds = 6 * 60 * 60
): TusUploadCredentials {
  const lib = libraryId();
  const key = required("BUNNY_STREAM_API_KEY");
  // Must outlast the whole upload: a slow connection pushing a ~1GB lecture
  // needs hours, and an expired signature fails the request mid-transfer.
  const expire = Math.floor(Date.now() / 1000) + ttlSeconds;
  const signature = crypto
    .createHash("sha256")
    .update(lib + key + expire + bunnyVideoId)
    .digest("hex");
  return {
    endpoint: `${VIDEO_API_BASE}/tusupload`,
    libraryId: lib,
    videoId: bunnyVideoId,
    expire,
    signature,
  };
}

// Creates the video record in Bunny and returns its GUID. Upload follows
// separately via uploadVideo().
export async function createVideo(title: string): Promise<string> {
  const res = await fetch(`${VIDEO_API_BASE}/library/${libraryId()}/videos`, {
    method: "POST",
    headers: {
      AccessKey: required("BUNNY_STREAM_API_KEY"),
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) {
    throw new Error(`Bunny createVideo failed (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  if (!data?.guid) {
    throw new Error("Bunny createVideo returned no guid.");
  }
  return data.guid as string;
}

// Uploads the raw bytes for a video GUID created by createVideo().
// Bunny transcodes asynchronously into the enabled resolution ladder.
export async function uploadVideo(
  bunnyVideoId: string,
  body: Buffer | ReadableStream,
  contentLength?: number
): Promise<void> {
  const headers: Record<string, string> = {
    AccessKey: required("BUNNY_STREAM_API_KEY"),
    "Content-Type": "application/octet-stream",
  };
  if (contentLength !== undefined) {
    headers["Content-Length"] = String(contentLength);
  }

  const res = await fetch(
    `${VIDEO_API_BASE}/library/${libraryId()}/videos/${bunnyVideoId}`,
    {
      method: "PUT",
      headers,
      body: body as BodyInit,
      // Node needs this to stream a request body rather than buffering it.
      ...(body instanceof Buffer ? {} : { duplex: "half" }),
    } as RequestInit
  );
  if (!res.ok) {
    throw new Error(`Bunny upload failed (${res.status}): ${await res.text()}`);
  }
}

export interface BunnyVideoStatus {
  guid: string;
  title: string;
  // 0 queued, 1 processing, 2 encoding, 3 finished, 4 resolution finished,
  // 5 failed, 6 presigned upload started
  status: number;
  encodeProgress: number;
  length: number;
}

export async function getVideo(bunnyVideoId: string): Promise<BunnyVideoStatus> {
  const res = await fetch(
    `${VIDEO_API_BASE}/library/${libraryId()}/videos/${bunnyVideoId}`,
    {
      headers: {
        AccessKey: required("BUNNY_STREAM_API_KEY"),
        accept: "application/json",
      },
    }
  );
  if (!res.ok) {
    throw new Error(`Bunny getVideo failed (${res.status}): ${await res.text()}`);
  }
  const d = await res.json();
  return {
    guid: d.guid,
    title: d.title,
    status: d.status,
    encodeProgress: d.encodeProgress ?? 0,
    length: d.length ?? 0,
  };
}

export async function deleteVideo(bunnyVideoId: string): Promise<void> {
  const res = await fetch(
    `${VIDEO_API_BASE}/library/${libraryId()}/videos/${bunnyVideoId}`,
    {
      method: "DELETE",
      headers: {
        AccessKey: required("BUNNY_STREAM_API_KEY"),
        accept: "application/json",
      },
    }
  );
  if (!res.ok && res.status !== 404) {
    throw new Error(`Bunny deleteVideo failed (${res.status}): ${await res.text()}`);
  }
}

// Pulls a video into Bunny directly from a source URL. Bunny fetches the bytes
// itself, so migrating from Supabase never routes the file through our server.
export async function fetchVideoFromUrl(
  bunnyVideoId: string,
  sourceUrl: string
): Promise<void> {
  const res = await fetch(
    `${VIDEO_API_BASE}/library/${libraryId()}/videos/${bunnyVideoId}/fetch`,
    {
      method: "POST",
      headers: {
        AccessKey: required("BUNNY_STREAM_API_KEY"),
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({ url: sourceUrl }),
    }
  );
  if (!res.ok) {
    throw new Error(`Bunny fetch failed (${res.status}): ${await res.text()}`);
  }
}

export interface BunnyVideoListItem {
  guid: string;
  title: string;
  status: number;
  encodeProgress: number;
  length: number;
  dateUploaded?: string;
  views?: number;
}

export async function listBunnyVideos(
  page = 1,
  itemsPerPage = 100
): Promise<BunnyVideoListItem[]> {
  const lib = libraryId();
  const key = required("BUNNY_STREAM_API_KEY");
  const res = await fetch(
    `${VIDEO_API_BASE}/library/${lib}/videos?page=${page}&itemsPerPage=${itemsPerPage}&orderBy=date`,
    {
      headers: {
        AccessKey: key,
        accept: "application/json",
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(`Bunny listBunnyVideos failed (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];

  return items.map((item: any) => ({
    guid: item.guid,
    title: item.title || "Untitled Video",
    status: item.status ?? 0,
    encodeProgress: item.encodeProgress ?? 0,
    length: item.length ?? 0,
    dateUploaded: item.dateUploaded,
    views: item.views,
  }));
}

// Imports any videos existing in Bunny Stream that are not yet recorded in Supabase videos catalog
export async function syncBunnyVideosToCatalog(): Promise<{ synced: number; total: number }> {
  try {
    const { supabaseAdmin } = await import("@/lib/supabaseAdmin");
    const bunnyVideos = await listBunnyVideos();
    if (!bunnyVideos.length) return { synced: 0, total: 0 };

    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from("videos")
      .select("bunny_video_id");

    if (fetchErr) {
      console.error("Error fetching existing catalog for sync:", fetchErr);
      return { synced: 0, total: bunnyVideos.length };
    }

    const existingIds = new Set(
      (existing || []).map((v) => v.bunny_video_id).filter(Boolean)
    );

    const toInsert = bunnyVideos.filter((bv) => !existingIds.has(bv.guid));

    if (toInsert.length === 0) {
      return { synced: 0, total: bunnyVideos.length };
    }

    const rows = toInsert.map((bv) => ({
      title: bv.title || "Bunny Stream Video",
      description: `Uploaded on Bunny Stream (${bv.guid.slice(0, 8)}...)`,
      storage_path: "",
      bunny_video_id: bv.guid,
      active: true,
    }));

    const { error: insertErr } = await supabaseAdmin.from("videos").insert(rows);

    if (insertErr) {
      console.error("Error inserting synced Bunny videos:", insertErr);
    } else {
      console.log(`Successfully synced ${rows.length} videos from Bunny.net to catalog.`);
    }

    return { synced: rows.length, total: bunnyVideos.length };
  } catch (err) {
    console.error("syncBunnyVideosToCatalog failed:", err);
    return { synced: 0, total: 0 };
  }
}

