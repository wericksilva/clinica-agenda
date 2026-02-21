"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabaseClient"

export default function ConfigPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [clinicId, setClinicId] = useState<string | null>(null)

  const [clinicName, setClinicName] = useState("")
  const [message, setMessage] = useState("")
  const [sendHour, setSendHour] = useState(9)
  const [instanceId, setInstanceId] = useState("")
  const [token, setToken] = useState("")
  const [clientToken, setClientToken] = useState("")

  useEffect(() => {
    async function loadSettings() {
      setLoading(true)

      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        console.error("Usuário não autenticado")
        setLoading(false)
        return
      }

      // 🔥 Buscar clínica vinculada ao usuário
       let { data: clinic } = await supabase
        .from("clinics")
        .select("*")
        .eq("owner_id", userData.user.id)
        .maybeSingle()

      // 🔥 Se não existir clínica, cria automaticamente
      if (!clinic) {
        const { data: newClinic, error: insertError } = await supabase
          .from("clinics")
          .insert({
            name: "Minha Clínica",
            owner_id: userData.user.id, // 👈 corrigido
          })
          .select()
          .single()

        if (insertError) {
          console.error("Erro ao criar clínica:", insertError)
          setLoading(false)
          return
        }

        clinic = newClinic
      }

      setClinicId(clinic.id)

      // 🔥 Buscar configurações
      const { data: settings } = await supabase
        .from("clinic_settings")
        .select("*")
        .eq("clinic_id", clinic.id)
        .maybeSingle()

      if (settings) {
        setClinicName(settings.clinic_name || "")
        setMessage(settings.reminder_message || "")
        setSendHour(settings.send_hour || 9)
        setInstanceId(settings.zapi_instance_id || "")
        setToken(settings.zapi_token || "")
        setClientToken(settings.zapi_client_token || "")
      }

      setLoading(false)
    }

    loadSettings()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()

    if (!clinicId) {
      alert("Erro: Clínica não encontrada")
      return
    }

    const { error } = await supabase
      .from("clinic_settings")
      .upsert(
        {
          clinic_id: clinicId,
          clinic_name: clinicName,
          reminder_message: message,
          send_hour: sendHour,
          zapi_instance_id: instanceId,
          zapi_token: token,
          zapi_client_token: clientToken,
        },
        {
          onConflict: "clinic_id",
        }
      )

    if (error) {
      console.error("Erro ao salvar:", error)
      alert("Erro ao salvar configurações")
      return
    }

    alert("Configurações salvas com sucesso!")
  }

  if (loading) {
    return <div className="p-6">Carregando...</div>
  }

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Configurações</h1>

      <form onSubmit={handleSave} className="space-y-4">

        <div>
          <label>Nome da Clínica</label>
          <input
            className="w-full border p-2 rounded"
            value={clinicName}
            onChange={(e) => setClinicName(e.target.value)}
          />
        </div>

        <div>
          <label>Mensagem de Lembrete</label>
          <textarea
            className="w-full border p-2 rounded"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <p className="text-sm text-gray-500">
            Use: {"{{nome}}"} {"{{data}}"} {"{{hora}}"}
          </p>
        </div>

        <div>
          <label>Horário de Envio (0-23)</label>
          <input
            type="number"
            min={0}
            max={23}
            className="w-full border p-2 rounded"
            value={sendHour}
            onChange={(e) => setSendHour(Number(e.target.value))}
          />
        </div>

        <div>
          <label>Z-API Instance ID</label>
          <input
            className="w-full border p-2 rounded"
            value={instanceId}
            onChange={(e) => setInstanceId(e.target.value)}
          />
        </div>

        <div>
          <label>Z-API Token</label>
          <input
            className="w-full border p-2 rounded"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </div>

        <div>
          <label>Z-API Client Token</label>
          <input
            className="w-full border p-2 rounded"
            value={clientToken}
            onChange={(e) => setClientToken(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Salvar Configurações
        </button>

      </form>
    </div>
  )
}