"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

type ClinicSettings = {
  clinic_name: string | null
}

export default function Header() {
  const supabase = createClient()
  const router = useRouter()

  const [clinicName, setClinicName] = useState<string>("Carregando...")
  const [userEmail, setUserEmail] = useState<string>("")

  useEffect(() => {
    async function loadHeader() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      setUserEmail(user.email ?? "")

      // 🔹 Buscar clínica do usuário
      const { data: clinic } = await supabase
        .from("clinics")
        .select("id")
        .eq("owner_id", user.id)
        .single()

      if (!clinic) {
        setClinicName("Minha Clínica")
        return
      }

      // 🔹 Buscar nome correto da clínica
      const { data: settings } = await supabase
        .from("clinic_settings")
        .select("clinic_name")
        .eq("clinic_id", clinic.id)
        .single<ClinicSettings>()

      if (settings?.clinic_name) {
        setClinicName(settings.clinic_name)
      } else {
        setClinicName("Minha Clínica")
      }
    }

    loadHeader()
  }, [router, supabase])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6">
      
      {/* Nome da Clínica */}
      <h2 className="font-semibold text-lg ml-[59px]">
        {clinicName}
      </h2>

      {/* Email + Logout */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-gray-600">{userEmail}</span>

        <button
          onClick={handleLogout}
          className="text-red-500 hover:text-red-700 font-medium"
        >
          Sair
        </button>
      </div>
    </header>
  )
}