"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabaseClient"

type Client = {
  id: string
  name: string
  phone: string
}

export default function ClientesPage() {
  const supabase = createClient()

  const [clinicId, setClinicId] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(true)

  const [searchName, setSearchName] = useState("")
  const [searchPhone, setSearchPhone] = useState("")



  // ✅ MOVIDO PARA CIMA
  async function loadClients(clinicId: string) {
    const { data } = await supabase
      .from("clients")
      .select("*")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false })

    if (data) setClients(data)
    setLoading(false)
  }

  useEffect(() => {
    async function loadClinic() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { data } = await supabase
        .from("clinics")
        .select("id")
        .eq("owner_id", user.id)
        .single()

      if (data) {
        setClinicId(data.id)
        await loadClients(data.id)
      }
    }

    loadClinic()
  }, [])

  async function handleCreateClient(e: React.FormEvent) {
    e.preventDefault()
    if (!clinicId) return

    const { error } = await supabase.from("clients").insert({
      name,
      phone: `55${phone}`,
      clinic_id: clinicId,
    })

    if (error) {
      alert(error.message)
      return
    }

    setName("")
    setPhone("")
    loadClients(clinicId)
  }

  async function handleDeleteClient(id: string) {
  const confirmDelete = confirm("Tem certeza que deseja excluir?")

  if (!confirmDelete || !clinicId) return

  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", id)

  if (error) {
    alert(error.message)
    return
  }

  loadClients(clinicId)
}

const filteredClients = clients.filter((client) => {
  const matchesName = client.name
    .toLowerCase()
    .includes(searchName.toLowerCase())

  const matchesPhone = searchPhone
    ? client.phone.includes(`55${searchPhone}`)
    : true

  return matchesName && matchesPhone
})

function formatPhoneBR(value: string) {
  // Remove tudo que não for número
  const numbers = value.replace(/\D/g, "")

  // Remove o 55 se o usuário tentar digitar
  const cleaned = numbers.startsWith("55")
    ? numbers.slice(2)
    : numbers

  const ddd = cleaned.slice(0, 2)
  const firstPart = cleaned.slice(2, 7)
  const secondPart = cleaned.slice(7, 11)

  if (!ddd) return "+55 "

  if (cleaned.length <= 2)
    return `+55 (${ddd}`

  if (cleaned.length <= 7)
    return `+55 (${ddd}) ${firstPart}`

  return `+55 (${ddd}) ${firstPart}-${secondPart}`
}


function formatPhoneFromDB(value: string) {
  if (!value) return ""

  const numbers = value.replace(/\D/g, "")

  // remove 55 inicial
  const cleaned = numbers.startsWith("55")
    ? numbers.slice(2)
    : numbers

  const ddd = cleaned.slice(0, 2)
  const firstPart = cleaned.slice(2, 7)
  const secondPart = cleaned.slice(7, 11)

  if (!ddd) return "+55 "
  if (cleaned.length <= 2) return `+55 (${ddd}`
  if (cleaned.length <= 7) return `+55 (${ddd}) ${firstPart}`

  return `+55 (${ddd}) ${firstPart}-${secondPart}`
}

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Clientes</h1>

      <form
        onSubmit={handleCreateClient}
        className="bg-white p-6 rounded-xl shadow space-y-4 max-w-md"
      >
        <input
          type="text"
          placeholder="Nome"
          className="w-full border p-2 rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="+55 (11) 91234-5678"
          className="w-full border p-2 rounded"
          value={formatPhoneBR(phone)}
          onChange={(e) => {
            const numbers = e.target.value.replace(/\D/g, "")
            const cleaned = numbers.startsWith("55")
              ? numbers.slice(2)
              : numbers
            setPhone(cleaned)
          }}
          required
        />

        <button className="bg-black text-white px-4 py-2 rounded">
          Adicionar Cliente
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

  {/* Filtro por telefone */}
 <input
  type="text"
  placeholder="+55 (11) 91234-5678"
  className="flex-1 border p-2 rounded"
  value={formatPhoneFromDB(searchPhone)}
  onChange={(e) => {
    const numbers = e.target.value.replace(/\D/g, "")
    const cleaned = numbers.startsWith("55")
      ? numbers.slice(2)
      : numbers
    setSearchPhone(cleaned)
  }}
/>


</div>

      <div className="bg-white rounded-xl shadow">
        {loading ? (
          <p className="p-4">Carregando...</p>
        ) : filteredClients.length === 0 ? (
          <p className="p-4 text-gray-500">Nenhum cliente cadastrado.</p>
        ) : (
          <ul>
            {filteredClients.map((client) => (
              <li
                key={client.id}
                className="flex justify-between items-center p-4 border-b"
                >
                <div>
                    <p className="font-medium">{client.name}</p>
                   <p className="text-sm text-gray-500">
                    {formatPhoneFromDB(client.phone)}
                  </p>
                </div>

                <button
                    onClick={() => handleDeleteClient(client.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                >
                    Excluir
                </button>
                </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}