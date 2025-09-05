"use client"

import { useState } from "react"
import { SearchIcon } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

export function Search() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <SearchIcon className="h-4 w-4" />
        <span className="hidden md:inline-flex">Search...</span>
        <kbd className="hidden rounded border bg-muted px-1.5 font-mono text-xs md:inline-flex">⌘K</kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search across the salon..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Clients">
            <CommandItem>Emma Johnson</CommandItem>
            <CommandItem>Michael Chen</CommandItem>
            <CommandItem>Sophia Rodriguez</CommandItem>
          </CommandGroup>
          <CommandGroup heading="Staff">
            <CommandItem>David Kim</CommandItem>
            <CommandItem>Jessica Lee</CommandItem>
            <CommandItem>Robert Taylor</CommandItem>
          </CommandGroup>
          <CommandGroup heading="Services">
            <CommandItem>Haircut & Style</CommandItem>
            <CommandItem>Color Treatment</CommandItem>
            <CommandItem>Manicure & Pedicure</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}

