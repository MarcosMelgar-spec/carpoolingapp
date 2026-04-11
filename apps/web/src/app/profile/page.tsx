import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <>
      <Navbar userEmail={user.email} />

      <div className="bg-[#1e3a5f]">
        <div className="max-w-lg mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-white">Mi perfil</h1>
          <p className="text-white/60 text-sm mt-0.5">{user.email}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Avatar + stats */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white font-bold text-2xl shrink-0">
              {profile?.full_name?.charAt(0).toUpperCase() ?? user.email?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div>
              <p className="font-bold text-slate-800 text-lg leading-tight">
                {profile?.full_name ?? "Sin nombre"}
              </p>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-sm text-slate-500">
                  ⭐ {Number(profile?.rating ?? 5).toFixed(1)}
                </span>
                <span className="text-slate-200 text-xs">·</span>
                <span className="text-sm text-slate-500">
                  {profile?.trips_as_driver ?? 0} viajes como conductor
                </span>
                <span className="text-slate-200 text-xs">·</span>
                <span className="text-sm text-slate-500">
                  {profile?.trips_as_passenger ?? 0} como pasajero
                </span>
              </div>
            </div>
          </div>
        </div>

        <ProfileForm
          userId={user.id}
          initialName={profile?.full_name ?? ""}
          initialPhone={profile?.phone ?? ""}
        />
      </div>
    </>
  );
}
