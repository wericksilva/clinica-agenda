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
  <div className="min-h-screen bg-slate-50 px-4 py-6">
    <div className="max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">
          Agendamentos
        </h1>
        <p className="text-sm text-gray-500">
          Gerencie todos os atendimentos da sua clínica
        </p>
      </div>

      {/* Card Formulário */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <form
          onSubmit={handleSaveAppointment}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <select
            className="border p-3 rounded-lg w-full"
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
            className="border p-3 rounded-lg w-full"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <button className=" bg-green-600 text-white rounded-lg px-4 py-3 hover:opacity-90 transition">
            {editingId ? "Atualizar" : "Criar"}
          </button>
        </form>
      </div>

      {/* Card Filtros */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Pesquisar por nome..."
            className="border p-3 rounded-lg w-full"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />

          <input
            type="date"
            className="border p-3 rounded-lg w-full"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
          />
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        {loading ? (
          <p className="p-6 text-gray-500">Carregando...</p>
        ) : filteredAppointments.length === 0 ? (
          <p className="p-6 text-gray-500">
            Nenhum agendamento encontrado.
          </p>
        ) : (
          <ul className="divide-y">
            {filteredAppointments.map((appt) => {
              const status = getStatusConfig(appt.status)

              return (
                <li
                  key={appt.id}
                  onClick={() => handleSelectAppointment(appt)}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 hover:bg-slate-50 transition cursor-pointer"
                >
                  <div>
                    <p className="font-semibold text-gray-800">
                      {appt.clients?.name}
                    </p>

                    <p className="text-sm text-gray-500">
                      {formatDateBR(appt.appointment_date)}
                    </p>
                  </div>

                  <span
                    className={`text-xs font-medium px-3 py-1 rounded-full ${status.className}`}
                  >
                    {status.label}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>

    </div>
  </div>
)
}