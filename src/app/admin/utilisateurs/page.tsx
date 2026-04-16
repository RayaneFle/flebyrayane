import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import RoleChanger from "./RoleChanger";
import DeleteUserBtn from "./DeleteUserBtn";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "admin" && session.user.role !== "teacher")) redirect("/admin");
  const isAdmin = session.user.role === "admin";

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          activityResults: true,
          enrollments: true,
          classroomMemberships: true,
          lessonProgress: true,
        },
      },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">Utilisateurs</h1>
          <p className="text-sm text-slate-400">{users.length} utilisateur{users.length > 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
              <th className="text-left px-4 py-3">Nom</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-center px-4 py-3">Rôle</th>
              <th className="text-center px-4 py-3">Classes</th>
              <th className="text-center px-4 py-3">Leçons</th>
              <th className="text-center px-4 py-3">Activités</th>
              <th className="text-right px-4 py-3">Inscrit</th>
              {isAdmin && <th className="text-right px-4 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-brand-50/30 transition-colors">
                <td className="px-4 py-3">
                  <Link href={"/admin/utilisateurs/" + u.id} className="flex items-center gap-2 hover:text-brand-700">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-300 to-accent-400 flex items-center justify-center text-white text-xs font-bold">{u.name?.charAt(0) || "?"}</div>
                    <span className="font-medium text-slate-800 truncate max-w-[160px]">{u.name || "—"}</span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">{u.email}</td>
                <td className="px-4 py-3 text-center">
                  {isAdmin ? <RoleChanger userId={u.id} currentRole={u.role} /> : <span className="text-xs capitalize text-slate-500">{u.role}</span>}
                </td>
                <td className="px-4 py-3 text-center text-sm">{u._count.classroomMemberships}</td>
                <td className="px-4 py-3 text-center text-sm">{u._count.lessonProgress}</td>
                <td className="px-4 py-3 text-center text-sm">{u._count.activityResults}</td>
                <td className="px-4 py-3 text-right text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString("fr-FR")}</td>
                {isAdmin && <td className="px-4 py-3 text-right"><DeleteUserBtn userId={u.id} email={u.email || ""} currentUserEmail={session.user.email || ""} /></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}