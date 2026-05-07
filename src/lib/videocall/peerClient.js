const parsePort = (value) => {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export const getPeerClientOptions = () => {
  const host = process.env.NEXT_PUBLIC_PEER_HOST
  const port = parsePort(process.env.NEXT_PUBLIC_PEER_PORT)
  const path = process.env.NEXT_PUBLIC_PEER_PATH || "/"
  const key = process.env.NEXT_PUBLIC_PEER_KEY
  const secure = process.env.NEXT_PUBLIC_PEER_SECURE === "false" ? false : undefined

  return {
    ...(host ? { host } : {}),
    ...(port ? { port } : {}),
    ...(path ? { path } : {}),
    ...(key ? { key } : {}),
    ...(secure !== undefined ? { secure } : {}),
  }
}

export const createPeerClient = async () => {
  const { default: Peer } = await import("peerjs")
  const options = getPeerClientOptions()
  const hasOptions = Object.keys(options).length > 0
  return hasOptions ? new Peer(undefined, options) : new Peer()
}
