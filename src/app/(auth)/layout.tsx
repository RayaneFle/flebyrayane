import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-brand-50 via-white to-accent-50">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2 w-fit group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-heading font-black text-sm">R</div>
          <span className="font-heading font-bold text-brand-800">FLE<span className="text-accent-500">by</span>Rayane</span>
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 pb-12">{children}</div>
    </div>
  );
}
