"use client";
import { useState, useEffect } from "react";

export default function MemoryGame({ config, onComplete }: { config: any; onComplete: (s: number, details?: any[]) => void }) {
  const [cards, setCards] = useState<any[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matched, setMatched] = useState(0);
  const total = config.pairs.length;

  useEffect(() => {
    const c: any[] = [];
    config.pairs.forEach((p: any, i: number) => {
      c.push({ id: i*2, text: p.front, img: p.frontImage, pairId: i, flipped: false, matched: false });
      c.push({ id: i*2+1, text: p.back, img: p.backImage, pairId: i, flipped: false, matched: false });
    });
    for (let i = c.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [c[i],c[j]] = [c[j],c[i]]; }
    setCards(c);
  }, [config.pairs]);

  function flip(id: number) {
    const card = cards.find(c => c.id === id);
    if (!card || card.flipped || card.matched || flipped.length >= 2) return;
    const nf = [...flipped, id];
    setFlipped(nf);
    setCards(p => p.map(c => c.id === id ? { ...c, flipped: true } : c));
    if (nf.length === 2) {
      setMoves(m => m+1);
      const a = cards.find(c => c.id === nf[0])!;
      const b = cards.find(c => c.id === id)!;
      if (a.pairId === b.pairId) {
        setTimeout(() => {
          setCards(p => p.map(c => c.pairId === a.pairId ? { ...c, matched: true } : c));
          setFlipped([]);
          const nm = matched+1; setMatched(nm);
          if (nm === total) { const r = Math.max(0, 1-(moves+1-total)/(total*2)); const details = config.pairs.map((p: any) => ({ question: p.front || '(image)', userAnswer: p.back || '(image)', correctAnswer: p.back || '(image)', isCorrect: true })); onComplete(Math.round(r*100), details); }
        }, 500);
      } else {
        setTimeout(() => { setCards(p => p.map(c => nf.includes(c.id) ? { ...c, flipped: false } : c)); setFlipped([]); }, 1000);
      }
    }
  }

  const cols = cards.length <= 8 ? 4 : cards.length <= 12 ? 4 : 6;
  return (
    <div className="bg-white rounded-2xl border border-brand-100 p-6 sm:p-8">
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-slate-400">{matched}/{total} paires</p>
        <span className="text-sm text-slate-400">\ud83d\udc46 {moves}</span>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {cards.map(card => (
          <button key={card.id} onClick={() => flip(card.id)} disabled={card.matched || card.flipped} className="aspect-square perspective-1000">
            <div className={`relative w-full h-full transition-transform duration-500 preserve-3d ${card.flipped || card.matched ? "rotate-y-180" : ""}`}>
              <div className="absolute inset-0 backface-hidden rounded-xl bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center cursor-pointer hover:from-brand-300 shadow-md">
                <span className="text-white text-2xl font-heading font-bold">?</span>
              </div>
              <div className={`absolute inset-0 backface-hidden rotate-y-180 rounded-xl flex flex-col items-center justify-center p-2 text-center shadow-md ${card.matched ? "bg-green-50 border-2 border-green-300" : "bg-white border-2 border-brand-200"}`}>
                {card.img ? <img src={card.img} alt="" className="max-h-full max-w-full rounded-lg object-contain" /> : <span className="text-sm font-medium break-words leading-tight text-slate-800">{card.text || "?"}</span>}
                {card.img && card.text && <span className="text-[10px] text-slate-400 mt-1 truncate max-w-full">{card.text}</span>}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}