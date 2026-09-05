export function getStoredUser() {
  if (typeof window === "undefined") return null

  try {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      const parsed = JSON.parse(storedUser)
      if (parsed?.id != null) return parsed
    }

    const fullInfo = localStorage.getItem("fullInfo")
    if (fullInfo) {
      const profile = JSON.parse(fullInfo)
      if (profile?.id != null) {
        return {
          id: profile.id,
          email: profile.email,
          username: profile.username,
          second_name: profile.rwandan_name,
        }
      }
    }
  } catch {
    return null
  }

  return null
}

export function getStoredUserId() {
  const user = getStoredUser()
  return user?.id != null ? String(user.id) : null
}

export function getStoredUserDisplayName() {
  if (typeof window === "undefined") return "Someone"

  try {
    const fullInfo = localStorage.getItem("fullInfo")
    if (fullInfo) {
      const profile = JSON.parse(fullInfo)
      const name = `${profile.first_name || ""} ${profile.rwandan_name || ""}`.trim()
      if (name) return name
      if (profile.username) return profile.username
    }

    const user = getStoredUser()
    if (user?.username) return user.username
    if (user?.second_name) return user.second_name
    if (user?.email) return user.email
  } catch {
    // ignore parse errors
  }

  return "Someone"
}
