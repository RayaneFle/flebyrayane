import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { activityTypeLabels, levelColors, levelEmoji } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const revalidate = 60;

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const [recentActivities, courseCount, activityCount, userCount] = await Promise.all([
    prisma.activity.findMany({ where: { isPublic: true, title: { not: "" } }, orderBy: { createdAt: "desc" }, take: 6, include: { createdBy: { select: { name: true } }, _count: { select: { results: true } } } }),
    prisma.course.count({ where: { published: true } }),
    prisma.activity.count({ where: { isPublic: true } }),
    prisma.user.count(),
  ]);

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-accent-600">
        <div className="absolute top-0 right-0 w-72 h-72 bg-accent-400/20 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="flex-1 text-center md:text-left">
              <h1 className="font-heading text-3xl md:text-5xl font-extrabold text-white leading-tight">
                Apprenez le français<br /><span className="bg-gradient-to-r from-accent-200 to-yellow-200 bg-clip-text text-transparent">en vous amusant</span>
              </h1>
              <p className="mt-4 text-base md:text-lg text-pink-100/80 max-w-md leading-relaxed">Cours structures, exercices ludiques et suivi de progression - tout en un.</p>
              <div className="mt-3 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 border border-white/20">
                <span className="text-sm">&#10003;</span>
                <span className="text-xs font-semibold text-white">100% gratuit, sans publicite</span>
              </div>
              <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
                <Link href="/activites" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand-700 font-semibold rounded-xl hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm">🎮 Jouer</Link>
                <Link href="/cours" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20 text-sm">📖 Cours</Link>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
              <MiniStat n={courseCount} l="Cours" e="📖" />
              <MiniStat n={activityCount} l="Activités" e="🎮" />
              <MiniStat n={userCount} l="Apprenants" e="👥" />
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-brand-900">Choisissez votre niveau</h2>
          <p className="text-brand-400 mt-2">Du débutant complet au niveau maîtrise</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 stagger-children">
          {(["A1","A2","B1","B2","C1","C2"] as const).map((lv) => (
            <Link key={lv} href={`/cours?level=${lv}`} className="group flex flex-col items-center p-5 rounded-2xl border-2 border-brand-100 hover:border-accent-300 hover:shadow-card-hover card-hover bg-white animate-fade-in-up">
              <span className="text-2xl mb-1">{levelEmoji[lv]}</span>
              <span className={`text-xl font-heading font-extrabold px-3 py-1 rounded-lg ${levelColors[lv]}`}>{lv}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-brand-900">Comment ca marche ?</h2>
          <p className="text-brand-400 mt-2">3 etapes pour commencer a apprendre</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <StepCard num="1" emoji="&#128100;" title="Creez un compte" desc="Inscription en 30 secondes, gratuite et sans engagement." />
          <StepCard num="2" emoji="&#127971;" title="Rejoignez ou explorez" desc="Entrez le code de votre classe ou parcourez les cours libres." />
          <StepCard num="3" emoji="&#127919;" title="Apprenez en jouant" desc="Suivez les lecons, faites les activites et progressez a votre rythme." />
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-center text-brand-900 mb-10">Tout ce qu&apos;il faut pour progresser</h2>
          <div className="grid md:grid-cols-3 gap-6 stagger-children">
            <FCard emoji="📖" title="Cours structurés" desc="Des leçons organisées par niveau CECRL avec exercices intégrés." href="/cours" gradient="from-brand-50 to-pink-50" border="border-brand-100" />
            <FCard emoji="🎮" title="Activités ludiques" desc="QCM, memory, pendu, glisser-déposer, catégorisation… pour ne jamais s'ennuyer." href="/activites" gradient="from-accent-50 to-purple-50" border="border-accent-100" />
            <FCard emoji="📊" title="Suivi intelligent" desc="Suivez vos scores, identifiez vos erreurs et mesurez vos progrès." href={session ? "/dashboard" : "/register"} gradient="from-green-50 to-emerald-50" border="border-green-100" />
          </div>
        </div>
      </section>

      {recentActivities.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-2xl font-bold text-brand-900">Dernières activités</h2>
            <Link href="/activites" className="text-sm font-semibold text-accent-600 hover:text-accent-700">Tout voir →</Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
            {recentActivities.map((a) => {
              const t = activityTypeLabels[a.type] || { label: a.type, emoji: "📝" };
              return (
                <Link key={a.id} href={`/activites/${a.id}`} className="group bg-white rounded-2xl p-5 border border-brand-100 card-hover animate-fade-in-up">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{t.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-semibold group-hover:text-brand-600 transition-colors truncate">{a.title}</h3>
                      <p className="text-sm text-brand-400 mt-0.5">{t.label} {a.level && <span className={`ml-2 inline-block px-2 py-0.5 rounded text-[10px] font-bold ${levelColors[a.level]}`}>{a.level}</span>}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-600 to-accent-600" />
        <div className="relative max-w-2xl mx-auto px-4 py-14 text-center">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-white mb-3">Prêt à commencer ?</h2>
          <p className="text-pink-100/70 mb-8">Créez un compte gratuit et commencez à apprendre.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link href={session ? "/dashboard" : "/register"} className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-brand-700 font-bold rounded-xl hover:shadow-xl transition-all">
              {session ? "📊 Mon espace" : "✨ Créer mon compte"}
            </Link>
            <Link href="/activites" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20">Essayer sans compte</Link>
          </div>
        </div>
      </section>
    </>
  );
}

function MiniStat({ n, l, e }: { n: number; l: string; e: string }) {
  return <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/10"><span className="text-xl">{e}</span><p className="font-heading text-2xl font-bold text-white mt-1">{n}</p><p className="text-xs text-pink-100/60">{l}</p></div>;
}
function FCard({ emoji, title, desc, href, gradient, border }: { emoji: string; title: string; desc: string; href: string; gradient: string; border: string }) {
  return <Link href={href} className={`group block p-7 rounded-2xl border-2 ${border} bg-gradient-to-br ${gradient} card-hover animate-fade-in-up`}><span className="text-3xl">{emoji}</span><h3 className="font-heading text-lg font-bold mt-3 group-hover:text-brand-600 transition-colors">{title}</h3><p className="text-brand-500 mt-2 text-sm leading-relaxed">{desc}</p></Link>;
}

function StepCard({ num, emoji, title, desc }: { num: string; emoji: string; title: string; desc: string }) {
  return (
    <div className="relative bg-white rounded-2xl p-6 border-2 border-brand-100 hover:border-accent-300 transition-all">
      <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-white font-heading font-bold text-lg flex items-center justify-center shadow-lg">{num}</div>
      <span className="text-3xl">{emoji}</span>
      <h3 className="font-heading font-bold text-lg text-brand-900 mt-3">{title}</h3>
      <p className="text-sm text-brand-500 mt-2 leading-relaxed">{desc}</p>
    </div>
  );
}
