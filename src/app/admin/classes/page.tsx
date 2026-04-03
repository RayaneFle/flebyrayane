import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CreateClassroomForm from "./CreateForm";

export default async function AdminClassesPage() {
  const session = await getServerSession(authOptions);
  const classrooms = await prisma.classroom.findMany({
    where: { ownerId: session?.user?.id || "" },
    include: { _count: { select: { members: true, courses: true, posts: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="font-heading text-3xl font-bold text-slate-900">Mes classes</h1><p className="text-slate-400">{classrooms.length} classe(s)</p></div>
      </div>
      <CreateClassroomForm />
      {classrooms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-brand-100 p-12 text-center mt-6"><span className="text-5xl">🏫</span><p className="text-slate-400 mt-4">Aucune classe créée.</p></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {classrooms.map(c => (
            <Link key={c.id} href={`/admin/classes/${c.id}`} className="bg-white rounded-2xl border border-brand-100 p-6 card-hover group">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-bold text-lg text-slate-900 group-hover:text-brand-600 transition-colors">{c.name}</h3>
                <span className="px-3 py-1 bg-brand-100 text-brand-700 text-xs font-bold rounded-lg font-mono tracking-widest">{c.code}</span>
              </div>
              {c.description && <p className="text-sm text-slate-400 mb-3">{c.description}</p>}
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span>👥 {c._count.members} élève{c._count.members !== 1 ? "s" : ""}</span>
                <span>📖 {c._count.courses} cours</span>
                <span>📌 {c._count.posts} post{c._count.posts !== 1 ? "s" : ""}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
