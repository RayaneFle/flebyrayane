import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
  const pw = await bcrypt.hash("Admin123!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@flebyrayane.com" }, update: {},
    create: { email: "admin@flebyrayane.com", name: "Rayane", hashedPassword: pw, role: "admin" },
  });
  console.log("Admin OK: admin@flebyrayane.com / Admin123!");

  await prisma.course.upsert({
    where: { slug: "francais-a1" }, update: {},
    create: { title: "Francais debutant A1", description: "Apprenez les bases du francais.", slug: "francais-a1", level: "A1", published: true, authorId: admin.id,
      sections: { create: [
        { title: "Se presenter", position: 0, lessons: { create: [
          { title: "Bonjour je m appelle", type: "TEXT", position: 0, blocks: { create: [
            { position: 0, type: "text", content: "<h2>Se presenter en francais</h2><p>Quand on rencontre quelqu'un, on dit :</p><ul><li><strong>Bonjour !</strong> - Hello</li><li><strong>Je m'appelle...</strong> - My name is...</li><li><strong>Comment allez-vous ?</strong> - How are you?</li></ul><p>Essayez l'exercice ci-dessous !</p>" },
          ]}},
        ]}},
        { title: "Les articles", position: 1, lessons: { create: [
          { title: "Le la les", type: "TEXT", position: 0 },
        ]}},
      ]},
    },
  });
  console.log("Cours A1 OK");

  await prisma.course.upsert({
    where: { slug: "francais-b1" }, update: {},
    create: { title: "Francais intermediaire B1", description: "Perfectionnez votre francais.", slug: "francais-b1", level: "B1", published: true, authorId: admin.id, requiresEnrollment: true, enrollmentCode: "FLE2024" },
  });
  console.log("Cours B1 OK (code: FLE2024)");

  const configs = [
    { title: "QCM - Les articles", type: "QCM", level: "A1", config: { questions: [{ question: "Article devant soleil (masculin) ?", options: ["Le","La","Les","Un"], correctIndex: 0, explanation: "Masculin singulier = le" }, { question: "___ fleurs sont belles.", options: ["Le","La","Les","Un"], correctIndex: 2 }] } },
    { title: "Memory - Les couleurs", type: "MEMORY", level: "A1", config: { pairs: [{ front:"Rouge", back:"Red" },{ front:"Bleu", back:"Blue" },{ front:"Vert", back:"Green" },{ front:"Jaune", back:"Yellow" }] } },
    { title: "Pendu - Les animaux", type: "HANGMAN", level: "A1", config: { words: [{ word:"CHAT", hint:"Il miaule" },{ word:"CHIEN", hint:"Il aboie" },{ word:"OISEAU", hint:"Il vole" }] } },
    { title: "Vrai/Faux - La France", type: "TRUE_FALSE", level: "A2", config: { questions: [{ statement:"Paris est la capitale.", isTrue:true },{ statement:"La France a 50 departements.", isTrue:false, explanation:"101 departements." }] } },
    { title: "Appariement - Verbe etre", type: "MATCHING", level: "A1", config: { pairs: [{ left:"Je", right:"suis" },{ left:"Tu", right:"es" },{ left:"Nous", right:"sommes" }] } },
    { title: "Texte a trous - Se presenter", type: "FILL_BLANKS", level: "A1", config: { text: "Je {{suis}} francais. J {{ai}} 25 ans." } },
    { title: "Glisser-deposer - Les saisons", type: "DRAG_DROP", level: "A1", config: { pairs: [{ item:"Neige", target:"Hiver" },{ item:"Soleil", target:"Ete" },{ item:"Feuilles", target:"Automne" },{ item:"Fleurs", target:"Printemps" }] } },
    { title: "Classement - Jours", type: "SORTING", level: "A1", config: { items:["Lundi","Mardi","Mercredi","Jeudi","Vendredi"], correctOrder:["Lundi","Mardi","Mercredi","Jeudi","Vendredi"], instruction:"Remettez en ordre" } },
    { title: "Categorisation - Genre", type: "CATEGORIZE", level: "A1", config: { categories:["Masculin","Feminin"], items:[{ text:"Le livre", category:"Masculin" },{ text:"La table", category:"Feminin" },{ text:"Le chat", category:"Masculin" },{ text:"La maison", category:"Feminin" }] } },
  ];

  for (const c of configs) {
    await prisma.activity.create({ data: { title: c.title, type: c.type, level: c.level, isPublic: true, createdById: admin.id, config: JSON.stringify(c.config) } });
  }
  console.log("9 activites OK");
  console.log("\nConnectez-vous: admin@flebyrayane.com / Admin123!");
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
