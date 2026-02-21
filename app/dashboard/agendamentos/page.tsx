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

  const [searchName, setSearchName] = useState("")
  const [searchDate, setSearchDate] = useState("")

  const [editingId, setEditingId] = useState<string | null>(null)


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

  
  async function handleSaveAppointment(e: React.FormEvent) {
  e.preventDefault()
  if (!clinicId) return

  if (editingId) {
    // UPDATE
    const { error } = await supabase
      .from("appointments")
      .update({
        client_id: selectedClient,
        appointment_date: date,
      })
      .eq("id", editingId)

    if (error) {
      alert(error.message)
      return
    }

  } else {
    // INSERT
    const { error } = await supabase.from("appointments").insert({
      clinic_id: clinicId,
      client_id: selectedClient,
      appointment_date: date,
    })

    if (error) {
      alert(error.message)
      return
    }
  }

  // Resetar formulário
  setSelectedClient("")
  setDate("")
  setEditingId(null)

  loadAppointments(clinicId)
}

  const filteredAppointments = appointments.filter((appt) => {
  const matchesName = appt.clients?.name
    ?.toLowerCase()
    .includes(searchName.toLowerCase())

  const matchesDate = searchDate
    ? appt.appointment_date.startsWith(searchDate)
    : true

  return matchesName && matchesDate
})

function handleSelectAppointment(appt: Appointment) {
  setEditingId(appt.id)
  setSelectedClient(
    clients.find((c) => c.name === appt.clients?.name)?.id || ""
  )
  setDate(appt.appointment_date.slice(0, 16)) 
}

function getStatusConfig(status: string) {
  switch (status) {
    case "scheduled":
      return {
        label: "Agendado",
        className: "bg-blue-100 text-blue-700",
      }
    case "completed":
      return {
        label: "Concluído",
        className: "bg-green-100 text-green-700",
      }
    case "cancelled":
      return {
        label: "Cancelado",
        className: "bg-red-100 text-red-700",
      }
    default:
      return {
        label: status,
        className: "bg-gray-100 text-gray-700",
      }
  }
}

function formatDateBR(dateString: string) {
  const date = new Date(dateString)

  const formattedDate = date.toLocaleDateString("pt-BR")
  const formattedTime = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return `${formattedDate} às ${formattedTime}`
}

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Agendamentos</h1>

      <form
        onSubmit={handleSaveAppointment}
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
          {editingId ? "Atualizar Agendamento" : "Criar Agendamento"}
        </button>

      </form>

      <div className="bg-white p-4 rounded-xl shadow flex gap-4 max-w-2xl">
        {/* Filtro por nome */}
        <input
          type="text"
          placeholder="Pesquisar por nome..."
          className="flex-1 border p-2 rounded"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />

        {/* Filtro por data */}
        <input
          type="date"
          className="border p-2 rounded"
          value={searchDate}
          onChange={(e) => setSearchDate(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow">
        {loading ? (
          <p className="p-4">Carregando...</p>
        ) : filteredAppointments.length === 0 ? (
          <p className="p-4 text-gray-500">
            Nenhum agendamento encontrado.
          </p>
        ) : (
          <ul>
            {filteredAppointments.map((appt) => (
              <li
                key={appt.id}
                onClick={() => handleSelectAppointment(appt)}
                className="p-4 border-b flex justify-between cursor-pointer hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium">
                    {appt.clients?.name}
                  </p>
                 
                  <p className="text-sm text-gray-500">
                    {formatDateBR(appt.appointment_date)}
                  </p>

                </div>
                {(() => {
                    const status = getStatusConfig(appt.status)

                    return (
                      <span
                        className={`text-xs font-medium px-3 py-1 rounded-full ${status.className}`}
                      >
                        {status.label}
                      </span>
                    )
                  })()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}