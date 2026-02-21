"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabaseClient"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

type Appointment = {
  id: string
  appointment_date: string
  status: string
  clients?: {
    name: string
  }
}

type ChartItem = {
  date: string
  total: number
}

export default function DashboardPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [totalClients, setTotalClients] = useState<number>(0)
  const [totalAppointments, setTotalAppointments] = useState<number>(0)
  const [todayAppointments, setTodayAppointments] = useState<number>(0)
  const [scheduledAppointments, setScheduledAppointments] = useState<number>(0)
  const [completionRate, setCompletionRate] = useState<number>(0)
  const [growth, setGrowth] = useState<number>(0)
  const [chartData, setChartData] = useState<ChartItem[]>([])
  const [nextAppointments, setNextAppointments] = useState<Appointment[]>([])

  useEffect(() => {
    async function loadDashboard() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: clinic } = await supabase
        .from("clinics")
        .select("id")
        .eq("owner_id", user.id)
        .single()

      if (!clinic) return

      const { count: clientCount } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("clinic_id", clinic.id)

      const { data: appointments } = await supabase
        .from("appointments")
        .select("*, clients(name)")
        .eq("clinic_id", clinic.id)

      if (!appointments) return

      const todayISO = new Date().toISOString().slice(0, 10)

      const todayCount = appointments.filter((appt) =>
        appt.appointment_date.startsWith(todayISO)
      ).length

      const scheduledCount = appointments.filter(
        (appt) => appt.status === "scheduled"
      ).length

      const completedCount = appointments.filter(
        (appt) => appt.status === "completed"
      ).length

      const completion =
        appointments.length === 0
          ? 0
          : (completedCount / appointments.length) * 100

      // Crescimento mensal
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      const currentMonthCount = appointments.filter((appt) => {
        const date = new Date(appt.appointment_date)
        return (
          date.getMonth() === currentMonth &&
          date.getFullYear() === currentYear
        )
      }).length

      const previousMonthCount = appointments.filter((appt) => {
        const date = new Date(appt.appointment_date)
        return (
          date.getMonth() === currentMonth - 1 &&
          date.getFullYear() === currentYear
        )
      }).length

      const growthPercentage =
        previousMonthCount === 0
          ? 100
          : ((currentMonthCount - previousMonthCount) /
              previousMonthCount) *
            100

      // Últimos 7 dias tipado corretamente
      const last7Days: Record<string, number> = {}

      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const formatted = date.toISOString().slice(0, 10)
        last7Days[formatted] = 0
      }

      appointments.forEach((appt) => {
        const date = appt.appointment_date.slice(0, 10)
        if (date in last7Days) {
          last7Days[date] += 1
        }
      })

      const chartFormatted: ChartItem[] = Object.entries(last7Days).map(
        ([date, count]) => ({
          date: new Date(date).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
          }),
          total: count,
        })
      )

      const upcoming = appointments
        .filter(
          (appt) => new Date(appt.appointment_date) >= new Date()
        )
        .sort(
          (a, b) =>
            new Date(a.appointment_date).getTime() -
            new Date(b.appointment_date).getTime()
        )
        .slice(0, 5)

      setTotalClients(clientCount || 0)
      setTotalAppointments(appointments.length)
      setTodayAppointments(todayCount)
      setScheduledAppointments(scheduledCount)
      setCompletionRate(Number(completion.toFixed(1)))
      setGrowth(Number(growthPercentage.toFixed(1)))
      setChartData(chartFormatted)
      setNextAppointments(upcoming)
      setLoading(false)
    }

    loadDashboard()
  }, [])

  if (loading) return <p className="p-6">Carregando...</p>

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <StatCard title="Clientes" value={totalClients} />
        <StatCard title="Agendamentos" value={totalAppointments} />
        <StatCard title="Hoje" value={todayAppointments} />
        <StatCard
          title="Comparecimento"
          value={`${completionRate}%`}
          highlight={completionRate >= 70}
        />
        <StatCard
          title="Crescimento"
          value={`${growth}%`}
          highlight={growth >= 0}
        />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow">
        <h2 className="font-semibold mb-4">
          Agendamentos últimos 7 dias
        </h2>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow">
        <h2 className="font-semibold mb-4">
          Próximos agendamentos
        </h2>

        {nextAppointments.length === 0 ? (
          <p className="text-gray-500">
            Nenhum agendamento futuro.
          </p>
        ) : (
          <ul className="space-y-3">
            {nextAppointments.map((appt) => (
              <li
                key={appt.id}
                className="flex justify-between border-b pb-2"
              >
                <span>{appt.clients?.name}</span>
                <span className="text-sm text-gray-500">
                  {new Date(
                    appt.appointment_date
                  ).toLocaleString("pt-BR")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  highlight,
}: {
  title: string
  value: string | number
  highlight?: boolean
}) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow">
      <p className="text-sm text-gray-500">{title}</p>
      <p
        className={`text-3xl font-bold mt-2 ${
          highlight
            ? "text-green-600"
            : highlight === false
            ? "text-red-600"
            : ""
        }`}
      >
        {value}
      </p>
    </div>
  )
}