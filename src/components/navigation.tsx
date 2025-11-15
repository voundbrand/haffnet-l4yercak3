"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserMenu } from "@/components/user-menu"

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">HaffNet</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/seminare" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Seminare
            </Link>
            <Link href="/events" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Veranstaltungen
            </Link>
            <Link href="/uber-uns" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Über uns
            </Link>
            <Link href="/kontakt" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Kontakt
            </Link>
          </div>

          {/* Desktop Auth / User Menu */}
          <div className="hidden md:flex items-center gap-3">
            <UserMenu />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-foreground"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="px-4 py-4 space-y-3">
            <Link
              href="/seminare"
              className="block py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Seminare
            </Link>
            <Link
              href="/events"
              className="block py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Veranstaltungen
            </Link>
            <Link
              href="/uber-uns"
              className="block py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Über uns
            </Link>
            <Link
              href="/kontakt"
              className="block py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Kontakt
            </Link>
            <div className="pt-3 border-t border-border">
              <UserMenu />
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
