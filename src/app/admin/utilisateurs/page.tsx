import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import RoleChanger from "./RoleChanger";
import DeleteUserBtn from "./DeleteUserBtn";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") redirect("/admin");
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, name: true, email: true, role: true, createdAt: true } });
  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-slate-900 mb-8">Utilisateurs</h1>
      <div className="bg-white rounded-2xl border border-brand-100 overflow-x-auto">
        <table className="w-full"><thead><tr className="border-b border-slate-100 bg-brand-50/50 text-xs font-semibold text-slate-400 uppercase"><th className="text-left px-5 py-3">Nom</th><th className="text-left px-5 py-3">Email</th><th className="text-center px-5 py-3">Rôle</th><th className="text-right px-5 py-3">Inscrit le</th><th className="text-right px-5 py-3">Actions</th></tr></thead>
        <tbody className="divide-y divide-slate-50">{users.map(u => (
          <tr key={u.id} className="hover:bg-brand-50/30">
            <td className="px-5 py-4 font-medium text-slate-800">{u.name || "—"}</td>
            <td className="px-5 py-4 text-sm text-slate-500">{u.email}</td>
            <td className="px-5 py-4 text-center"><RoleChanger userId={u.id} currentRole={u.role} /></td>
            <td className="px-5 py-4 text-right text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString("fr-FR")}</td><td className="px-5 py-4 text-right"><DeleteUserBtn userId={u.id} email={u.email} currentUserEmail={session?.user?.email || ""} /></td>
          </tr>
        ))}</tbody></table>
      </div>
    </div>
  );
}
