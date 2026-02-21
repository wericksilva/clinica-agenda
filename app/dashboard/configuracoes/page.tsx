"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabaseClient"

type ClinicSetting = {
  id: string
  clinic_name: string
  reminder_message: string
  send_hour: number
  zapi_instance_id: string
  zapi_token: string
  zapi_client_token: string
  created_at: string
}

export default function ConfigPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [clinicId, setClinicId] = useState<string | null>(null)

  const [clinicName, setClinicName] = useState("")
  const [message, setMessage] = useState("")
  const [sendHour, setSendHour] = useState(9)
  const [instanceId, setInstanceId] = useState("")
  const [token, setToken] = useState("")
  const [clientToken, setClientToken] = useState("")

  const [settingsList, setSettingsList] = useState<ClinicSetting[]>([])
  const [successMessage, setSuccessMessage] = useState("")

  // 🔥 Buscar lista de configurações
  async function fetchSettings(clinicId: string) {
    const { data } = await supabase
      .from("clinic_settings")
      .select("*")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false })

    if (data) {
      setSettingsList(data)
    }
  }

  useEffect(() => {
    async function loadData() {
      setLoading(true)

      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        setLoading(false)
        return
      }

      let { data: clinic } = await supabase
        .from("clinics")
        .select("*")
        .eq("owner_id", userData.user.id)
        .maybeSingle()

      if (!clinic) {
        const { data: newClinic } = await supabase
          .from("clinics")
          .insert({
            name: "Minha Clínica",
            owner_id: userData.user.id,
          })
          .select()
          .single()

        clinic = newClinic
      }

      setClinicId(clinic.id)
      await fetchSettings(clinic.id)

      setLoading(false)
    }

    loadData()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()

    if (!clinicId) return

    setSaving(true)

    const { error } = await supabase
      .from("clinic_settings")
      .insert({
        clinic_id: clinicId,
        clinic_name: clinicName,
        reminder_message: message,
        send_hour: sendHour,
        zapi_instance_id: instanceId,
        zapi_token: token,
        zapi_client_token: clientToken,
      })

    setSaving(false)

    if (error) {
      console.error(error)
      return
    }

    // ✅ Limpar campos
    setClinicName("")
    setMessage("")
    setSendHour(9)
    setInstanceId("")
    setToken("")
    setClientToken("")

    setSuccessMessage("Configuração salva com sucesso!")

    // 🔥 Recarregar tabela
    await fetchSettings(clinicId)

    setTimeout(() => setSuccessMessage(""), 3000)
  }

  if (loading) {
    return <div className="p-6">Carregando...</div>
  }

  return (
    <div className="max-w-5xl mx-auto bg-white p-6 rounded-lg shadow space-y-8">
      <h1 className="text-2xl font-bold">Configurações</h1>

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
        </div>

        <div>
          <label>Horário de Envio</label>
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
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          {saving ? "Salvando..." : "Salvar Configurações"}
        </button>

        {successMessage && (
          <p className="text-green-600 text-sm">{successMessage}</p>
        )}

      </form>

      {/* 🔥 TABELA */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Configurações Salvas
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Nome</th>
                <th className="p-2 border">Hora</th>
                <th className="p-2 border">Instance</th>
                <th className="p-2 border">Criado em</th>
              </tr>
            </thead>
            <tbody>
              {settingsList.map((item) => (
                <tr key={item.id}>
                  <td className="p-2 border">{item.clinic_name}</td>
                  <td className="p-2 border">{item.send_hour}h</td>
                  <td className="p-2 border">{item.zapi_instance_id}</td>
                  <td className="p-2 border">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}

              {settingsList.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center p-4 text-gray-500">
                    Nenhuma configuração salva ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}