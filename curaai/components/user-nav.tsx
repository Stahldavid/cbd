"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from 'next/navigation'
import { Skeleton } from "@/components/ui/skeleton"
import React, { useState } from "react"; // Added import
import DoctorSettingsModal from "./DoctorSettingsModal"; // Added import

export function UserNav() {
  const { user, signOut, loading } = useAuth()
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false); // Added state
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error("Error signing out: ", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="hidden md:block space-y-1">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-3 w-[70px]" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
        <Button variant="outline" onClick={() => router.push('/auth/login')}>
            Login
        </Button>
    ) 
  }

  const userEmail = user.email || "user@example.com"
  const fallbackText = user.email ? user.email.substring(0, 2).toUpperCase() : "U"
  const displayName = user.email
  const displayRole = "Doctor"

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 rounded-full px-2 flex items-center gap-2">
            <Avatar className="h-8 w-8 border-2 border-primary">
              <AvatarImage src={user.user_metadata?.avatar_url || undefined} alt={displayName || "User"} />
              <AvatarFallback className="bg-primary text-primary-foreground">{fallbackText}</AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground mt-1">{displayRole}</p>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {userEmail}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => router.push('/profile')}>
              <span>Profile</span>
            </DropdownMenuItem>
            {/* Updated Settings Item */}
            <DropdownMenuItem onClick={() => setIsSettingsModalOpen(true)}>
              <span>Settings</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Modal Component */}
      <DoctorSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </>
  )
}
