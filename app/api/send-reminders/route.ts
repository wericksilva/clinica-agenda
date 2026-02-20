import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: appointments, error } = await supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        reminder_sent,
        clients ( name, phone )
      `)
      .eq("reminder_sent", false)

    if (error) {
      console.error("Erro ao buscar agendamentos:", error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    console.log("Appointments encontrados:", appointments)

    for (const appt of appointments || []) {
      const client = Array.isArray(appt.clients)
        ? appt.clients[0]
        : appt.clients

      if (!client?.phone) continue

      const message = `Olá ${client.name}, lembrando do seu atendimento amanhã às ${appt.appointment_date}. 😊`

      console.log("Enviando para:", client.phone)

      const response = await fetch(
        `https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE_ID}/token/${process.env.ZAPI_TOKEN}/send-text`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Client-Token": process.env.ZAPI_CLIENT_TOKEN!
          },
          body: JSON.stringify({
            phone: client.phone,
            message
          })
        }
      )

      const result = await response.json()

      console.log("Status HTTP:", response.status)
      console.log("Resposta ZAPI:", result)

      if (response.ok) {
        await supabase
          .from("appointments")
          .update({ reminder_sent: true })
          .eq("id", appt.id)

        console.log("Lembrete marcado como enviado.")
      } else {
        console.error("Erro ao enviar mensagem:", result)
      }
    }

    return Response.json({ success: true })
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Erro geral:", err.message)
      return Response.json({ error: err.message }, { status: 500 })
    }

    return Response.json({ error: "Erro inesperado" }, { status: 500 })
  }
}