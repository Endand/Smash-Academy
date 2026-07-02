"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Check } from "lucide-react";
import { Nav } from "@/components/nav";
import { useAuth } from "@/components/auth-provider";
import { useContentContext } from "@/components/content-provider";

// ── Permission definitions ────────────────────────────────────────────────────

const PERMISSIONS = [
  {
    key: "edit_content",
    label: "Edit Text Content",
    desc: "Click-to-edit any text field on lessons, course pages, and site-wide content (headers, footers, descriptions)",
  },
  {
    key: "manage_sections",
    label: "Manage Lesson Sections",
    desc: "Add and remove sections, learning outcomes, assignment tasks, knowledge check questions, and resources on lesson pages",
  },
  {
    key: "edit_icons",
    label: "Edit Lesson Icons",
    desc: "Change the icon shown for each lesson in the course sidebar and overview (also controls the Project badge)",
  },
  {
    key: "manage_lessons",
    label: "Manage Lesson Availability",
    desc: 'Publish and unpublish lessons — controls whether a lesson links out or shows "Soon" on the course page',
  },
  {
    key: "manage_roles",
    label: "Manage Roles & Permissions",
    desc: "Access this panel and configure what each role is allowed to do across the site",
  },
] as const;

// ── Storage keys ──────────────────────────────────────────────────────────────

const ROLES_KEY = "__perm_roles__";
const rolePermKey = (role: string) => `__perm_${role.toLowerCase().replace(/\s+/g, "_")}__`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseJSON<T>(str: string | undefined, fallback: T): T {
  if (!str) return fallback;
  try { return JSON.parse(str) as T; }
  catch { return fallback; }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const { profile, loading } = useAuth();
  const { content, updateContent } = useContentContext();
  const [addingRole, setAddingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");

  const isAdmin = !!profile?.is_admin;

  useEffect(() => {
    if (!loading && !isAdmin) router.push("/");
  }, [loading, isAdmin, router]);

  if (loading || !isAdmin) return null;

  // ── Data from site_content ────────────────────────────────────────────────
  const roles: string[] = parseJSON(content[ROLES_KEY], []);

  const getRolePerms = (role: string): Record<string, boolean> =>
    parseJSON(content[rolePermKey(role)], {});

  // ── Handlers ──────────────────────────────────────────────────────────────
  const togglePerm = (role: string, permKey: string) => {
    const perms = getRolePerms(role);
    updateContent(rolePermKey(role), JSON.stringify({ ...perms, [permKey]: !perms[permKey] }));
  };

  const commitAddRole = () => {
    const name = newRoleName.trim();
    if (!name || roles.map(r => r.toLowerCase()).includes(name.toLowerCase())) return;
    updateContent(ROLES_KEY, JSON.stringify([...roles, name]));
    setNewRoleName("");
    setAddingRole(false);
  };

  const removeRole = (role: string) => {
    updateContent(ROLES_KEY, JSON.stringify(roles.filter(r => r !== role)));
    updateContent(rolePermKey(role), "{}");
  };

  return (
    <>
      <Nav />
      <main className="pt-14 min-h-screen">
        <div className="max-w-5xl mx-auto px-6 py-16">

          {/* Header */}
          <div className="mb-12">
            <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--text-muted)] mb-3">
              Admin
            </p>
            <h1 className="text-3xl font-extralight tracking-wide text-[var(--text)] mb-4">
              Roles & Permissions
            </h1>
            <p className="text-sm leading-relaxed max-w-xl" style={{ color: "var(--text-muted)" }}>
              Define what each role can do across the site. Roles are assigned to users separately.
              Changes take effect immediately for all sessions.
            </p>
          </div>

          {/* Table */}
          <div
            className="overflow-x-auto"
            style={{
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-card)",
            }}
          >
            <table className="w-full border-collapse min-w-[480px]">
              <thead>
                <tr
                  style={{
                    background: "var(--surface)",
                    borderBottom: "1px solid var(--border-color)",
                  }}
                >
                  {/* Permission column */}
                  <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                    Permission
                  </th>

                  {/* Role columns */}
                  {roles.map((role) => (
                    <th
                      key={role}
                      className="px-5 py-3 text-center font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)] min-w-[130px]"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span>{role}</span>
                        <button
                          onClick={() => removeRole(role)}
                          title={`Remove ${role} role`}
                          className="opacity-30 hover:opacity-100 transition-opacity cursor-pointer"
                          style={{ color: "var(--text-muted)" }}
                        >
                          <X size={10} />
                        </button>
                      </div>
                    </th>
                  ))}

                  {/* Add Role column */}
                  <th className="px-5 py-3 text-center min-w-[130px]">
                    {addingRole ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <input
                          autoFocus
                          value={newRoleName}
                          onChange={(e) => setNewRoleName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitAddRole();
                            if (e.key === "Escape") {
                              setAddingRole(false);
                              setNewRoleName("");
                            }
                          }}
                          placeholder="Role name"
                          className="w-24 px-2 py-1 text-[11px] font-mono bg-transparent outline-none"
                          style={{
                            border: "1px solid var(--border-strong)",
                            borderRadius: "var(--radius-button)",
                            color: "var(--text)",
                          }}
                        />
                        <button
                          onClick={commitAddRole}
                          className="cursor-pointer"
                          style={{ color: "var(--accent-medium)" }}
                        >
                          <Check size={13} />
                        </button>
                        <button
                          onClick={() => { setAddingRole(false); setNewRoleName(""); }}
                          className="cursor-pointer"
                          style={{ color: "var(--text-muted)" }}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingRole(true)}
                        className="flex items-center gap-1.5 mx-auto font-mono text-[10px] uppercase tracking-widest cursor-pointer transition-colors"
                        style={{ color: "var(--text-muted)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent-medium)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
                      >
                        <Plus size={11} />
                        Add Role
                      </button>
                    )}
                  </th>
                </tr>
              </thead>

              <tbody>
                {PERMISSIONS.map((perm, idx) => (
                  <tr
                    key={perm.key}
                    style={{
                      borderBottom:
                        idx < PERMISSIONS.length - 1
                          ? "1px solid var(--border-color)"
                          : "none",
                    }}
                  >
                    {/* Permission label + description */}
                    <td className="px-5 py-4">
                      <div className="text-sm text-[var(--text)] mb-0.5 font-light">
                        {perm.label}
                      </div>
                      <div
                        className="text-[12px] leading-snug"
                        style={{ color: "var(--text-muted)", opacity: 0.65 }}
                      >
                        {perm.desc}
                      </div>
                    </td>

                    {/* Toggle cells for each role */}
                    {roles.map((role) => {
                      const perms = getRolePerms(role);
                      const enabled = !!perms[perm.key];
                      return (
                        <td key={role} className="px-5 py-4 text-center">
                          <button
                            onClick={() => togglePerm(role, perm.key)}
                            className="w-5 h-5 rounded flex items-center justify-center mx-auto cursor-pointer transition-all"
                            style={{
                              background: enabled ? "var(--accent)" : "transparent",
                              border: enabled
                                ? "1px solid var(--accent)"
                                : "1px solid var(--border-strong)",
                            }}
                            title={enabled ? "Revoke permission" : "Grant permission"}
                          >
                            {enabled && <Check size={11} color="#fff" strokeWidth={2.5} />}
                          </button>
                        </td>
                      );
                    })}

                    {/* Spacer for Add Role column */}
                    <td />
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Empty state */}
            {roles.length === 0 && (
              <div
                className="px-5 py-14 text-center text-[13px] italic"
                style={{ color: "var(--text-muted)", opacity: 0.45 }}
              >
                No roles yet. Click "Add Role" above to create one.
              </div>
            )}
          </div>

          {/* Footer note */}
          <p
            className="mt-5 text-[11px] font-mono leading-relaxed"
            style={{ color: "var(--text-muted)", opacity: 0.4 }}
          >
            Full admin access is always granted to users with{" "}
            <code>is_admin = true</code> in the profiles table, regardless of role.
          </p>
        </div>
      </main>
    </>
  );
}
