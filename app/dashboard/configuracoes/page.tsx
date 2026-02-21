"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabaseClient"

type ClinicSetting = {
  id: string
  clinic_id: string
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
  const [editingId, setEditingId] = useState<string | null>(null)

  const [clinicName, setClinicName] = useState("")
  const [message, setMessage] = useState("")
  const [sendHour, setSendHour] = useState(9)
  const [instanceId, setInstanceId] = useState("")
  const [token, setToken] = useState("")
  const [clientToken, setClientToken] = useState("")

  const [settingsList, setSettingsList] = useState<ClinicSetting[]>([])
  const [successMessage, setSuccessMessage] = useState("")

  //  Buscar configurações
  async function fetchSettings(clinicId: string) {
    const { data } = await supabase
      .from("clinic_settings")
      .select("*")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false })

    if (data) setSettingsList(data)
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

  function handleEdit(item: ClinicSetting) {
    setEditingId(item.id)
    setClinicName(item.clinic_name)
    setMessage(item.reminder_message)
    setSendHour(item.send_hour)
    setInstanceId(item.zapi_instance_id)
    setToken(item.zapi_token)
    setClientToken(item.zapi_client_token)

    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!clinicId) return

    setSaving(true)

    let error

    if (editingId) {
      const response = await supabase
        .from("clinic_settings")
        .update({
          clinic_name: clinicName,
          reminder_message: message,
          send_hour: sendHour,
          zapi_instance_id: instanceId,
          zapi_token: token,
          zapi_client_token: clientToken,
        })
        .eq("id", editingId)

      error = response.error
    } else {
      const response = await supabase
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

      error = response.error
    }

    setSaving(false)

    if (error) {
      console.error(error)
      return
    }

    // Reset
    setClinicName("")
    setMessage("")
    setSendHour(9)
    setInstanceId("")
    setToken("")
    setClientToken("")
    setEditingId(null)

    setSuccessMessage(
      editingId
        ? "Configuração atualizada com sucesso!"
        : "Configuração salva com sucesso!"
    )

    await fetchSettings(clinicId)
    setTimeout(() => setSuccessMessage(""), 3000)
  }

  if (loading) {
    return <div className="p-6">Carregando...</div>
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-5xl mx-auto bg-white p-4 sm:p-6 rounded-xl shadow space-y-8">

        <h1 className="text-xl sm:text-2xl font-bold">
          {editingId ? "Editando Configuração" : "Configurações"}
        </h1>

        <form onSubmit={handleSave} className="space-y-4">

          <div>
            <label className="block text-sm font-medium mb-1">
              Nome da Clínica
            </label>
            <input
              className="w-full border p-2.5 rounded-lg text-sm"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Mensagem de Lembrete
            </label>
            <textarea
              className="w-full border p-2.5 rounded-lg text-sm"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Horário de Envio (0-23)
            </label>
            <input
              type="number"
              min={0}
              max={23}
              className="w-full border p-2.5 rounded-lg text-sm"
              value={sendHour}
              onChange={(e) => setSendHour(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Z-API Instance ID
            </label>
            <input
              className="w-full border p-2.5 rounded-lg text-sm"
              value={instanceId}
              onChange={(e) => setInstanceId(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Z-API Token
            </label>
            <input
              className="w-full border p-2.5 rounded-lg text-sm"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Z-API Client Token
            </label>
            <input
              className="w-full border p-2.5 rounded-lg text-sm"
              value={clientToken}
              onChange={(e) => setClientToken(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition"
          >
            {editingId
              ? saving
                ? "Atualizando..."
                : "Atualizar Configuração"
              : saving
                ? "Salvando..."
                : "Salvar Configuração"}
          </button>

          {successMessage && (
            <p className="text-green-600 text-sm mt-2">
              {successMessage}
            </p>
          )}
        </form>

        {/*  TABELA */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-4">
            Configurações Salvas
          </h2>

          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Nome</th>
                  <th className="p-3 text-left">Hora</th>
                  <th className="p-3 text-left">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {settingsList.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleEdit(item)}
                    className={`border-t cursor-pointer hover:bg-gray-50 transition ${
                      editingId === item.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <td className="p-3">{item.clinic_name}</td>
                    <td className="p-3">{item.send_hour}h</td>
                    <td className="p-3">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}

                {settingsList.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center p-4 text-gray-500">
                      Nenhuma configuração salva ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}