export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">
          Reduza faltas na sua clínica automaticamente
        </h1>

        <p className="text-gray-600 text-lg">
          Confirmação automática de consultas via WhatsApp.
        </p>

        <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
          Testar gratuitamente
        </button>
      </div>
    </main>
  )
}
