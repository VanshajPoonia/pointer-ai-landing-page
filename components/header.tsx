"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import Link from "next/link" // Import Link for client-side navigation

export function Header() {
  const navItems = [
    { name: "Features", href: "#features-section" },
    { name: "Pricing", href: "#pricing-section" },
    { name: "Testimonials", href: "#testimonials-section" }, // Changed from Docs to Testimonials
  ]

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const targetId = href.substring(1) // Remove '#' from href
    const targetElement = document.getElementById(targetId)
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <header className="w-full py-4 px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-foreground text-xl font-semibold">Pointer</span>
          </div>
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => handleScroll(e, item.href)} // Add onClick handler
                className="text-[#888888] hover:text-foreground px-4 py-2 rounded-full font-medium transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="hidden md:block">
            <Button variant="ghost" className="text-foreground hover:text-foreground/80 px-6 py-2 rounded-full font-medium">
              Log In
            </Button>
          </Link>
          <Link href="/auth/sign-up" className="hidden md:block">
            <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-6 py-2 rounded-full font-medium shadow-sm">
              Sign Up
            </Button>
          </Link>
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-foreground">
                <Menu className="h-7 w-7" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="bg-background border-t border-border text-foreground">
              <SheetHeader>
                <SheetTitle className="text-left text-xl font-semibold text-foreground">Navigation</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-6">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={(e) => handleScroll(e, item.href)} // Add onClick handler
                    className="text-[#888888] hover:text-foreground justify-start text-lg py-2"
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="flex flex-col gap-3 mt-4">
                  <Link href="/auth/login" className="w-full">
                    <Button variant="ghost" className="w-full text-foreground hover:text-foreground/80 px-6 py-2 rounded-full font-medium">
                      Log In
                    </Button>
                  </Link>
                  <Link href="/auth/sign-up" className="w-full">
                    <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 px-6 py-2 rounded-full font-medium shadow-sm">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
