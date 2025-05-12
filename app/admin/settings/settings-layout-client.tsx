"use client"

import type React from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface SettingsLayoutProps {
  children: React.ReactNode
}

export default function SettingsLayoutClient({ children }: SettingsLayoutProps) {
  const pathname = usePathname()

  // Determine active tab based on pathname
  let activeTab = "currency"
  if (pathname.includes("/general")) activeTab = "general"
  if (pathname.includes("/api")) activeTab = "api"

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Tabs defaultValue={activeTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <Link href="/admin/settings/currency-settings" passHref>
              <TabsTrigger value="currency" asChild>
                <div className="w-full cursor-pointer">Moneda</div>
              </TabsTrigger>
            </Link>
            <Link href="/admin/settings/general" passHref>
              <TabsTrigger value="general" asChild>
                <div className="w-full cursor-pointer">General</div>
              </TabsTrigger>
            </Link>
            <Link href="/admin/settings/api" passHref>
              <TabsTrigger value="api" asChild>
                <div className="w-full cursor-pointer">API</div>
              </TabsTrigger>
            </Link>
          </TabsList>
        </Tabs>
      </div>
      {children}
    </div>
  )
}
