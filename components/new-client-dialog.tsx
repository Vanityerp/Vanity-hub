"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface NewClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewClientDialog({ open, onOpenChange }: NewClientDialogProps) {
  const { currentLocation } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [preferredLocation, setPreferredLocation] = useState(currentLocation === "all" ? "loc1" : currentLocation)
  const [notes, setNotes] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would create a new client via API
    console.log({
      name,
      email,
      phone,
      preferredLocation,
      notes,
      locations: [preferredLocation],
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New Client</DialogTitle>
            <DialogDescription>Add a new client to your salon database.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Preferred Location
              </Label>
              <Select value={preferredLocation} onValueChange={setPreferredLocation} required>
                <SelectTrigger id="location" className="col-span-3">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {currentLocation === "all" || currentLocation === "loc1" ? (
                    <SelectItem value="loc1">Downtown Location</SelectItem>
                  ) : null}
                  {currentLocation === "all" || currentLocation === "loc2" ? (
                    <SelectItem value="loc2">Westside Location</SelectItem>
                  ) : null}
                  {currentLocation === "all" || currentLocation === "loc3" ? (
                    <SelectItem value="loc3">Northside Location</SelectItem>
                  ) : null}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Create Client</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

