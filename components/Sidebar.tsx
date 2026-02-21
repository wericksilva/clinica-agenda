"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  Menu,
} from "lucide-react"

const menu = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Consultas", href: "/appointments", icon: Calendar },
  { name: "Clientes", href: "/clients", icon: Users },
  { name: "Configurações", href: "/settings", icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Botão mobile */}
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-md border"
      >
        <Menu size={20} />
      </button>

      <aside
        className={`
          bg-white border-r w-64 h-screen
          fixed md:static
          top-0 left-0
          transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        <div className="h-16 flex items-center px-6 border-b font-bold ml-[59px]">
          Clínica SaaS
        </div>

        <nav className="p-4 space-y-2">
          {menu.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 p-3 rounded-lg transition ${
                  active
                    ? "bg-green-100 text-green-700"
                    : "hover:bg-gray-100"
                }`}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}