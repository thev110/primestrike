import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Extract the Bearer token from an incoming request's Authorization header.
export function getBearer(request: Request): string {
  const authHeader = request.headers.get("authorization") || "";
  return authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
}

export interface AuthedUser {
  id: string;
  email: string;
  role: "student" | "admin";
  name: string | null;
}

// Resolve the logged-in user from their Supabase access token and load their
// profile role. Returns null when the token is missing/invalid.
export async function getAuthedUser(request: Request): Promise<AuthedUser | null> {
  const bearer = getBearer(request);
  if (!bearer) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(bearer);
  if (error || !data?.user) return null;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role, name, email")
    .eq("id", data.user.id)
    .single();

  return {
    id: data.user.id,
    email: profile?.email || data.user.email || "",
    role: (profile?.role as "student" | "admin") || "student",
    name: profile?.name ?? null,
  };
}

export async function requireAdmin(request: Request): Promise<AuthedUser | null> {
  const user = await getAuthedUser(request);
  return user && user.role === "admin" ? user : null;
}
