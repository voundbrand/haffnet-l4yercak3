"use client"

import { useState } from "react"
import Link from "next/link"
import { User, Settings, Calendar, FileText, LogOut, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

// Mock user data - would come from auth context in real app
const mockUser = {
  salutation: "Herr",
  title: "Dr.",
  firstName: "Max",
  lastName: "Mustermann",
  email: "max.mustermann@beispiel.de",
  phone: "+49 123 456789",
  organization: {
    name: "Universitätsklinikum Berlin",
    role: "Oberarzt",
    department: "Kardiologie",
  },
  profession: "Facharzt für Innere Medizin",
  isLoggedIn: false, // Change to true to see logged-in state
}

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false)

  if (!mockUser.isLoggedIn) {
    // Show login/register buttons when not logged in
    return (
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/anmelden">Anmelden</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/registrieren">Registrieren</Link>
        </Button>
      </div>
    )
  }

  // Show user menu when logged in
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
      >
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-green-600" />
        </div>
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-foreground">
            {mockUser.title ? `${mockUser.title} ` : ''}{mockUser.firstName} {mockUser.lastName}
          </div>
          <div className="text-xs text-muted-foreground">
            {mockUser.organization.name}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-background border border-border rounded-lg shadow-lg z-50">
            {/* User Info */}
            <div className="p-4 border-b border-border">
              <div className="font-medium text-foreground">
                {mockUser.title ? `${mockUser.title} ` : ''}{mockUser.firstName} {mockUser.lastName}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {mockUser.email}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {mockUser.organization.role} · {mockUser.organization.department}
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <Link
                href="/profil"
                className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <User className="w-4 h-4" />
                <span>Mein Profil</span>
              </Link>
              <Link
                href="/profil/buchungen"
                className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Calendar className="w-4 h-4" />
                <span>Meine Buchungen</span>
              </Link>
              <Link
                href="/profil/zertifikate"
                className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <FileText className="w-4 h-4" />
                <span>Zertifikate</span>
              </Link>
              <Link
                href="/profil/einstellungen"
                className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="w-4 h-4" />
                <span>Einstellungen</span>
              </Link>
            </div>

            {/* Logout */}
            <div className="border-t border-border py-2">
              <button
                className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                onClick={() => {
                  setIsOpen(false)
                  // Handle logout
                }}
              >
                <LogOut className="w-4 h-4" />
                <span>Abmelden</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
