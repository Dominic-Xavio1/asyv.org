"use client"

import * as React from "react"
import {useState,useEffect} from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { set } from "zod"
import toast from "react-hot-toast"

export default function ComboboxPopover({
  open,
  onClose,
  onSelect,
  children,
}) {
  const [query, setQuery] = React.useState("")
  const [filtered, setFiltered] = useState([])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmUser, setConfirmUser] = useState(null)
  const [creating, setCreating] = useState(false)

  const users = React.useMemo(() => [
    { id: "1", name: "Gafar Usman", avatar: "/default.png" },
    { id: "2", name: "Hafsoh Sade", avatar: "/tuff.webp" },
    { id: "3", name: "Gabriel Akande", avatar: "/tuff.webp" },
    { id: "4", name: "Hassan Akorede", avatar: "/tuff.webp" },
    { id: "5", name: "Devon Lane", avatar: "/tuff.webp" },
    { id: "6", name: "Jane Smith", avatar: "/tuff.webp" },
  ], [])

  // Start with local dummy users then hydrate from API if available
  useEffect(() => {
    setFiltered(users)

    async function fetchUsers(){
      try{
        const response = await fetch('/api/users/all')
        if (!response.ok) return
        const data = await response.json()
        if (Array.isArray(data.users) && data.users.length) setFiltered(data.users)
      }catch(e){
        console.error("Error fetching users:",e)
      }
    }
    fetchUsers()
  }, [users])
  const displayed = React.useMemo(() => {
    const list = Array.isArray(filtered) && filtered.length ? filtered : users
    if (!query.trim()) return list
    const q = query.toLowerCase()
    console.log("list to filter ",list);
    return list.filter(u => u.username.toLowerCase().includes(q))
  }, [filtered, users, query])

  const onItemSelectRequest = (user) => {
    // Open confirmation dialog
    setConfirmUser(user)
    setConfirmOpen(true)
  }

  const handleConfirmCreate = async () => {
    console.log("From closing confirmation",confirmUser)
    if (!confirmUser) return
    setCreating(true)
    try {
      // Prefer delegating to parent if they've provided a handler that actually starts a conversation
      if (typeof onSelect === "function") {
        const res = await Promise.resolve(onSelect(confirmUser))
        // parent handler may show its own toasts and handle selection
        // if it returned a falsy result we attempt a fallback below
        if (res) {
          try { onClose(false) } catch {}
          setConfirmOpen(false)
          setConfirmUser(null)
          return
        }
      }

      // Fallback: attempt to call the server directly using local user from localStorage
      const storedUser = (() => {
        try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
      })()

      if (!storedUser?.id) {
        toast.error('Unable to determine current user to create conversation')
        return
      }

      const resp = await fetch('/api/privatechat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user1: storedUser.id, user2: confirmUser.id }),
      })

      const data = await resp.json()
      if (!resp.ok || !data?.success) {
        console.error('Fallback creation failed', data)
        toast.error('Failed to create conversation')
        return
      }

      toast.success('Conversation created successfully')
      try { onClose(false) } catch {}
      setConfirmOpen(false)
      setConfirmUser(null)
    } catch (err) {
      console.error("Error creating conversation:", err)
      toast.error('Error creating conversation')
    } finally {
      setCreating(false)
    }
  }
  return (
    <Popover open={open} onOpenChange={onClose}>
      {children ? <PopoverTrigger asChild>{children}</PopoverTrigger> : null}

      <PopoverContent className="p-0 w-[320px]" side="right" align="start">
        <div className="px-3 py-2 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold">Start a conversation</h4>
              <p className="text-xs text-muted-foreground">Select a user to begin a private chat</p>
            </div>
          </div>
        </div>

        <Command>
          <CommandInput
            placeholder="Search users..."
            value={query}
            onValueChange={(val) => setQuery(val)}
            onChange={(e) => setQuery(e.target.value)}
          />
<CommandList>
          {displayed.length === 0 ? (
            <CommandEmpty>No users found.</CommandEmpty>
          ) : (
            <CommandGroup className="p-1">
              {displayed.map((user) => (
                <CommandItem
                  key={user.id}
                  className="rounded-md px-2 py-2 hover:bg-accent/5 dark:hover:bg-accent/10"
                  onSelect={() => onItemSelectRequest(user)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10">
                      <img src={user.avatar || '/default.png'} alt={user.username} className="h-8 w-8 rounded-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{user.first_name} {user.rwandan_name}</div>
                      <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>

        {/* Confirm dialog */}
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Start conversation?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-800 text-md">
                {confirmUser ? `Create a private conversation with ${confirmUser.first_name} ${confirmUser.rwandan_name}?` : "Create a new conversation?"}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-green-600 text-white hover:bg-green-700 hover:text-white">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmCreate} disabled={creating} className="bg-orange-500 hover:bg-orange-600">
                {creating ? "Creating..." : "Create"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
