export function getStoredUser() {
  if (typeof window === "undefined") return null

  try {
    const storedUser = localStorage.getItem("user")
    return storedUser ? JSON.parse(storedUser) : null
  } catch {
    return null
  }
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
