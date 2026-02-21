"use client"

import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command"
import {useState,useEffect} from "react"
export default function UserSearchDialog({ open, onOpenChange,onSelect }) {
    const [allUsers,setAllUsers] = useState([])
  const users = [
    { id: 1, name: "Dominic" },
    { id: 2, name: "Alice" },
    { id: 3, name: "Brian" },
  ]
  useEffect(() => {

    async function fetchUsers(){
      try{
        const response = await fetch('/api/users/all')
        if (!response.ok) return
        const data = await response.json()
        if (Array.isArray(data.users) && data.users.length) setAllUsers(data.users)
      }catch(e){
        console.error("Error fetching users in userSearchBox: ",e)
      }
    }
    fetchUsers()
  }, [])
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search users..." />

      <CommandList>
        <CommandEmpty>No users found.</CommandEmpty>

        {allUsers.map((user) => (
          <CommandItem
            key={user.id}
            onSelect={() => {
                onOpenChange(false)
                if(!window.confirm(`Create conversation with ${user.first_name} ${user.rwandan_name}`)) return
                onSelect(user);
            }}
          >
            {user.first_name} {user.rwandan_name}
          </CommandItem>
        ))}
      </CommandList>
    </CommandDialog>
  )
}