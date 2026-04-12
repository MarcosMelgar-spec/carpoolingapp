import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-12">
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-slate-400">© {new Date().getFullYear()} CarpoolingAR</p>
        <div className="flex items-center gap-6">
          <Link href="/terminos" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
            Términos y condiciones
          </Link>
          <Link href="/privacidad" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
            Política de privacidad
          </Link>
        </div>
      </div>
    </footer>
  );
}
