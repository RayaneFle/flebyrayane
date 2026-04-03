import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { levelColors, levelLabels } from "@/lib/utils";
import Link from "next/link";

export default async function CourseDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const course = await prisma.course.findUnique({
    where: { slug }, include: { author: { select: { name: true } }, sections: { orderBy: { position: "asc" }, include: { lessons: { orderBy: { position: "asc" } } } }, _count: { select: { enrollments: true } } },
  });
  if (!course || !course.published) notFound();
  const icons: Record<string, string> = { TEXT: "📝", VIDEO: "🎬", AUDIO: "🎧", PDF: "📄", MIXED: "📦" };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-2 text-sm text-brand-400 mb-6">
        <Link href="/cours" className="hover:text-brand-600">Cours</Link><span>/</span><span className="text-brand-600 font-medium">{course.title}</span>
      </div>
      <div className="bg-white rounded-2xl border border-brand-100 p-8 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className={`px-3 py-1 rounded-lg text-sm font-bold ${levelColors[course.level]}`}>{course.level}</span>
          <span className="text-sm text-brand-400">{levelLabels[course.level]}</span>
        </div>
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-brand-900 mb-4">{course.title}</h1>
        <p className="text-brand-500 text-lg leading-relaxed">{course.description}</p>
        <div className="flex flex-wrap items-center gap-5 mt-6 text-sm text-brand-400">
          <span>✍️ {course.author.name}</span><span>📚 {course.sections.length} sections</span><span>👥 {course._count.enrollments} inscrits</span>
        </div>
      </div>
      <div className="space-y-4">
        {course.sections.map((s, si) => (
          <div key={s.id} className="bg-white rounded-2xl border border-brand-100 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-brand-50 to-accent-50 border-b border-brand-100">
              <h2 className="font-heading font-bold text-brand-800"><span className="text-accent-500 mr-2">Section {si+1}</span>{s.title}</h2>
            </div>
            <div className="divide-y divide-brand-50">
              {s.lessons.map((l, li) => (
                <Link key={l.id} href={`/cours/${slug}/lecon/${l.id}`} className="flex items-center gap-4 px-6 py-4 hover:bg-brand-50/50 transition-colors">
                  <span className="text-xl">{icons[l.type] || "📝"}</span>
                  <p className="font-medium text-brand-800 flex-1">{si+1}.{li+1} — {l.title}</p>
                  <svg className="w-5 h-5 text-brand-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
