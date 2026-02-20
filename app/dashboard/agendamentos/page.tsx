"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabaseClient"

type Client = {
  id: string
  name: string
}

type Appointment = {
  id: string
  appointment_date: string
  status: string
  clients: {
    name: string
  }
}

export default function AgendamentosPage() {
  const supabase = createClient()

  const [clinicId, setClinicId] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedClient, setSelectedClient] = useState("")
  const [date, setDate] = useState("")
  const [loading, setLoading] = useState(true)

  async function loadAppointments(clinicId: string) {
    const { data } = await supabase
      .from("appointments")
      .select("*, clients(name)")
      .eq("clinic_id", clinicId)
      .order("appointment_date", { ascending: true })

    if (data) setAppointments(data as Appointment[])
    setLoading(false)
  }

  useEffect(() => {
    async function loadInitialData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: clinic } = await supabase
        .from("clinics")
        .select("id")
        .eq("owner_id", user.id)
        .single()

      if (!clinic) return

      setClinicId(clinic.id)

      const { data: clientList } = await supabase
        .from("clients")
        .select("id, name")
        .eq("clinic_id", clinic.id)

      if (clientList) setClients(clientList)

      loadAppointments(clinic.id)
    }

    loadInitialData()
  }, [])

  async function handleCreateAppointment(e: React.FormEvent) {
    e.preventDefault()
    if (!clinicId) return

    const { error } = await supabase.from("appointments").insert({
      clinic_id: clinicId,
      client_id: selectedClient,
      appointment_date: date,
    })

    if (error) {
      alert(error.message)
      return
    }

    setSelectedClient("")
    setDate("")
    loadAppointments(clinicId)
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Agendamentos</h1>

      <form
        onSubmit={handleCreateAppointment}
        className="bg-white p-6 rounded-xl shadow space-y-4 max-w-md"
      >
        <select
          className="w-full border p-2 rounded"
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          required
        >
          <option value="">Selecione o cliente</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>

        <input
          type="datetime-local"
          className="w-full border p-2 rounded"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <button className="bg-black text-white px-4 py-2 rounded">
          Criar Agendamento
        </button>
      </form>

      <div className="bg-white rounded-xl shadow">
        {loading ? (
          <p className="p-4">Carregando...</p>
        ) : appointments.length === 0 ? (
          <p className="p-4 text-gray-500">
            Nenhum agendamento encontrado.
          </p>
        ) : (
          <ul>
            {appointments.map((appt) => (
              <li
                key={appt.id}
                className="p-4 border-b flex justify-between"
              >
                <div>
                  <p className="font-medium">
                    {appt.clients?.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(appt.appointment_date).toLocaleString()}
                  </p>
                </div>
                <span className="text-sm bg-gray-200 px-2 py-1 rounded">
                  {appt.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}