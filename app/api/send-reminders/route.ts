import { createClient } from "@supabase/supabase-js"

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  //  Hora atual do servidor
  const now = new Date()
  const currentHour = now.getHours()

  console.log("Hora atual:", currentHour)

  // Buscar agendamentos ainda não enviados
  const { data: appointments, error } = await supabase
    .from("appointments")
    .select(`
      id,
      appointment_date,
      clinic_id,
      clients ( name, phone )
    `)
    .eq("reminder_sent", false)

  if (error) {
    console.error("Erro ao buscar agendamentos:", error)
    return Response.json({ error: true })
  }

  if (!appointments || appointments.length === 0) {
    console.log("Nenhum agendamento pendente.")
    return Response.json({ success: true })
  }

  for (const appt of appointments) {
    const client = Array.isArray(appt.clients)
      ? appt.clients[0]
      : appt.clients

    if (!client?.phone) continue

    // Buscar configurações da clínica
    const { data: settings } = await supabase
      .from("clinic_settings")
      .select("*")
      .eq("clinic_id", appt.clinic_id)
      .maybeSingle()

    if (!settings) {
      console.log("Configuração não encontrada para clínica:", appt.clinic_id)
      continue
    }

    //  Verificar se é a hora configurada
    if (currentHour !== settings.send_hour) {
      console.log(
        `Não é hora de envio. Atual: ${currentHour} | Configurado: ${settings.send_hour}`
      )
      continue
    }

    // Validar credenciais Z-API
    if (
      !settings.zapi_instance_id ||
      !settings.zapi_token ||
      !settings.zapi_client_token
    ) {
      console.log("Credenciais Z-API incompletas.")
      continue
    }

    // 🔥 Formatar data e hora do agendamento
    const date = new Date(appt.appointment_date)

    const formattedDate = date.toLocaleDateString("pt-BR")

    const formattedTime = date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })

    //  Mensagem padrão caso não exista personalizada
    const template =
      settings.reminder_message ||
      "Olá {{nome}}, seu atendimento está agendado para {{data}} às {{hora}}."

    // Substituir variáveis
    const message = template
      .replace("{{nome}}", client.name || "")
      .replace("{{data}}", formattedDate)
      .replace("{{hora}}", formattedTime)

    console.log("Mensagem final:", message)

    try {
      const response = await fetch(
        `https://api.z-api.io/instances/${settings.zapi_instance_id}/token/${settings.zapi_token}/send-text`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Client-Token": settings.zapi_client_token,
          },
          body: JSON.stringify({
            phone: client.phone,
            message,
          }),
        }
      )

      const result = await response.json()

      console.log("Resposta Z-API:", result)

      if (response.ok) {
        await supabase
          .from("appointments")
          .update({ reminder_sent: true })
          .eq("id", appt.id)

        console.log("Lembrete enviado e marcado como enviado.")
      } else {
        console.error("Erro na Z-API:", result)
      }
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err)
    }
  }

  return Response.json({ success: true })
}