"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface NavbarProps {
  userEmail?: string | null;
}

export default function Navbar({ userEmail }: NavbarProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <header className="bg-[#1e3a5f] shadow-lg">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sky-400 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">CarpoolingAR</span>
        </Link>

        <nav className="flex items-center gap-3">
          {userEmail ? (
            <>
              <Link
                href="/my-trips"
                className="text-white/80 hover:text-white text-sm transition-colors hidden sm:block"
              >
                Mis viajes
              </Link>
              <Link
                href="/trips/new"
                className="bg-sky-400 hover:bg-sky-500 text-white text-sm px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                + Publicar viaje
              </Link>
              <div className="hidden sm:flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
                <div className="w-6 h-6 rounded-full bg-sky-400 flex items-center justify-center text-xs font-bold text-white">
                  {userEmail.charAt(0).toUpperCase()}
                </div>
                <span className="text-white/80 text-xs max-w-[120px] truncate">{userEmail}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="text-white/60 hover:text-white text-sm transition-colors"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-white/80 hover:text-white text-sm transition-colors">
                Ingresar
              </Link>
              <Link
                href="/auth/register"
                className="bg-sky-400 hover:bg-sky-500 text-white text-sm px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Registrarse
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
