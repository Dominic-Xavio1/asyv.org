"use client"

import { useState, useEffect, useRef } from "react"

export default function UserSearchDialog({ open, onOpenChange, onSelect, isDarkMode = false }) {
  const [allUsers, setAllUsers] = useState([])
  const [query, setQuery] = useState("")
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch("/api/users/all")
        if (!response.ok) return
        const data = await response.json()
        if (Array.isArray(data.users) && data.users.length) setAllUsers(data.users)
      } catch (e) {
        console.error("Error fetching users in userSearchBox: ", e)
      }
    }
    fetchUsers()
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery("")
      setHighlighted(0)
    }
  }, [open])

  const filtered = allUsers.filter((u) => {
    const full = `${u.first_name} ${u.rwandan_name}`.toLowerCase()
    return full.includes(query.toLowerCase())
  })

  function handleSelect(user) {
    onOpenChange(false)
    if (!window.confirm(`Create conversation with ${user.first_name} ${user.rwandan_name}`)) return
    onSelect(user)
  }

  function handleKeyDown(e) {
    if (e.key === "ArrowDown") {
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === "ArrowUp") {
      setHighlighted((h) => Math.max(h - 1, 0))
    } else if (e.key === "Enter" && filtered[highlighted]) {
      handleSelect(filtered[highlighted])
    } else if (e.key === "Escape") {
      onOpenChange(false)
    }
  }

  if (!open) return null

  const d = isDarkMode

  const theme = {
    overlay:          d ? "rgba(5, 8, 15, 0.75)"  : "rgba(15, 10, 5, 0.45)",
    dialog:           d ? "#131929"                : "#ffffff",
    dialogBorder:     d ? "1px solid #1e2d45"      : "1px solid #ede8e2",
    headerBorder:     d ? "#1e2d45"                : "#f0ebe4",
    inputColor:       d ? "#e2e8f0"                : "#1a1209",
    inputPlaceholder: d ? "#4a5568"                : "#bbb0a4",
    labelColor:       d ? "#3a4f6a"                : "#c4b09a",
    itemHoverBg:      d ? "#1a2540"                : "#fff8f3",
    searchRowBg:      d ? "#0f1623"                : "#f9f5f1",
    avatarBg:         d ? "#1e2d45"                : "#f5ede4",
    avatarColor:      d ? "#f97316"                : "#e8711a",
    nameColor:        d ? "#e2e8f0"                : "#1f1510",
    subColor:         d ? "#4a5568"                : "#b0a090",
    closeBg:          d ? "#1a2540"                : "#f5f0eb",
    closeColor:       d ? "#4a5568"                : "#9e8e7e",
    closeHoverBg:     d ? "#1e3a5f"                : "#ffe0c8",
    keyBg:            d ? "#1a2540"                : "#f5ede4",
    keyColor:         d ? "#6b8aad"                : "#b08060",
    keyBorder:        d ? "#1e2d45"                : "#e8d5c4",
    countColor:       d ? "#3a4f6a"                : "#c4b09a",
    scrollbar:        d ? "#1e2d45"                : "#e8d5c4",
    emptyColor:       d ? "#3a4f6a"                : "#c0b0a0",
    accentColor:      "#f97316",
    shadow: d
      ? "0 4px 6px -1px rgba(0,0,0,0.5), 0 24px 60px -8px rgba(0,0,0,0.7), 0 0 0 1px rgba(30,45,69,0.9)"
      : "0 4px 6px -1px rgba(0,0,0,0.06), 0 24px 60px -8px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04)",
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600&display=swap');

        .usd-overlay {
          position: fixed;
          inset: 0;
          background: ${theme.overlay};
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: usd-fade-in 0.18s ease;
          font-family: 'Figtree', sans-serif;
        }

        @keyframes usd-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .usd-dialog {
          background: ${theme.dialog};
          border: ${theme.dialogBorder};
          border-radius: 18px;
          width: 440px;
          max-width: calc(100vw - 32px);
          box-shadow: ${theme.shadow};
          overflow: hidden;
          animation: usd-slide-up 0.22s cubic-bezier(0.22, 1, 0.36, 1);
        }

        @keyframes usd-slide-up {
          from { opacity: 0; transform: translateY(14px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── Header ── */
        .usd-header {
          padding: 18px 20px 14px;
          border-bottom: 1.5px solid ${theme.headerBorder};
        }

        .usd-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 13px;
        }

        .usd-title-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: ${theme.accentColor};
          box-shadow: 0 0 8px ${theme.accentColor}99;
        }

        .usd-title {
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          color: ${theme.accentColor};
        }

        /* ── Search box ── */
        .usd-search-row {
          display: flex;
          align-items: center;
          gap: 10px;
          background: ${theme.searchRowBg};
          border: 1.5px solid ${theme.headerBorder};
          border-radius: 10px;
          padding: 9px 12px;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .usd-search-row:focus-within {
          border-color: ${theme.accentColor}55;
          box-shadow: 0 0 0 3px ${theme.accentColor}18;
        }

        .usd-search-icon {
          color: ${theme.accentColor};
          flex-shrink: 0;
          opacity: 0.85;
        }

        .usd-input {
          flex: 1;
          border: none;
          outline: none;
          font-family: 'Figtree', sans-serif;
          font-size: 14.5px;
          font-weight: 400;
          color: ${theme.inputColor};
          background: transparent;
          caret-color: ${theme.accentColor};
        }

        .usd-input::placeholder {
          color: ${theme.inputPlaceholder};
          font-weight: 300;
        }

        .usd-close {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: none;
          background: ${theme.closeBg};
          color: ${theme.closeColor};
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.15s, color 0.15s;
        }

        .usd-close:hover {
          background: ${theme.closeHoverBg};
          color: ${theme.accentColor};
        }

        .usd-meta {
          margin-top: 9px;
          font-size: 10.5px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: ${theme.labelColor};
        }

        /* ── List ── */
        .usd-list {
          max-height: 300px;
          overflow-y: auto;
          padding: 6px 0 8px;
          scrollbar-width: thin;
          scrollbar-color: ${theme.scrollbar} transparent;
        }

        .usd-list::-webkit-scrollbar { width: 4px; }
        .usd-list::-webkit-scrollbar-track { background: transparent; }
        .usd-list::-webkit-scrollbar-thumb {
          background: ${theme.scrollbar};
          border-radius: 99px;
        }

        /* ── Items ── */
        .usd-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 9px 20px;
          cursor: pointer;
          transition: background 0.1s;
          position: relative;
        }

        /* Orange left-bar indicator */
        .usd-item::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%) scaleY(0);
          width: 3px;
          height: 55%;
          background: ${theme.accentColor};
          border-radius: 0 3px 3px 0;
          transition: transform 0.15s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .usd-item:hover,
        .usd-item.active {
          background: ${theme.itemHoverBg};
        }

        .usd-item.active::before {
          transform: translateY(-50%) scaleY(1);
        }

        .usd-item.active .usd-avatar {
          background: ${theme.accentColor};
          color: #fff;
          box-shadow: 0 0 14px ${theme.accentColor}55;
        }

        /* ── Avatar ── */
        .usd-avatar {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: ${theme.avatarBg};
          color: ${theme.avatarColor};
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.15s, color 0.15s, box-shadow 0.2s;
          letter-spacing: 0.02em;
        }

        .usd-name {
          font-size: 14px;
          font-weight: 500;
          color: ${theme.nameColor};
          line-height: 1;
        }

        .usd-sub {
          font-size: 11.5px;
          color: ${theme.subColor};
          font-weight: 300;
          margin-top: 3px;
        }

        .usd-highlight {
          color: ${theme.accentColor};
          font-weight: 600;
        }

        .usd-online-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          margin-left: 6px;
          vertical-align: middle;
          box-shadow: 0 0 6px #22c55e88;
        }

        /* ── Empty ── */
        .usd-empty {
          padding: 36px 20px;
          text-align: center;
          color: ${theme.emptyColor};
          font-size: 14px;
          font-weight: 300;
        }

        .usd-empty-icon {
          font-size: 26px;
          margin-bottom: 8px;
          opacity: 0.45;
        }

        /* ── Footer ── */
        .usd-divider {
          height: 1.5px;
          background: ${theme.headerBorder};
        }

        .usd-footer {
          padding: 10px 20px 13px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .usd-hint {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: ${theme.countColor};
          font-weight: 300;
        }

        .usd-key {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: ${theme.keyBg};
          border-radius: 5px;
          padding: 1px 5px;
          font-size: 10px;
          font-weight: 600;
          color: ${theme.keyColor};
          border: 1px solid ${theme.keyBorder};
          line-height: 1.6;
          font-family: monospace;
        }

        .usd-count {
          margin-left: auto;
          font-size: 11px;
          color: ${theme.countColor};
          font-weight: 400;
        }
      `}</style>

      <div className="usd-overlay" onClick={() => onOpenChange(false)}>
        <div
          className="usd-dialog"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleKeyDown}
        >
          {/* Header */}
          <div className="usd-header">
            <div className="usd-title-row">
              <div className="usd-title-dot" />
              <span className="usd-title">Start a Conversation</span>
            </div>

            <div className="usd-search-row">
              <svg className="usd-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                ref={inputRef}
                className="usd-input"
                placeholder="Search users..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setHighlighted(0) }}
              />
              <button className="usd-close" onClick={() => onOpenChange(false)} aria-label="Close">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="usd-meta">
              {query
                ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""} for "${query}"`
                : `${allUsers.length} member${allUsers.length !== 1 ? "s" : ""} in your village`
              }
            </div>
          </div>

          {/* List */}
          <div className="usd-list" ref={listRef}>
            {filtered.length === 0 ? (
              <div className="usd-empty">
                <div className="usd-empty-icon">🔍</div>
                No users found for "<strong>{query}</strong>"
              </div>
            ) : (
              filtered.map((user, i) => {
                const initials = `${user.first_name?.[0] ?? ""}${user.rwandan_name?.[0] ?? ""}`.toUpperCase()
                const fullName = `${user.first_name} ${user.rwandan_name}`

                const renderName = () => {
                  if (!query) return fullName
                  const idx = fullName.toLowerCase().indexOf(query.toLowerCase())
                  if (idx === -1) return fullName
                  return (
                    <>
                      {fullName.slice(0, idx)}
                      <span className="usd-highlight">{fullName.slice(idx, idx + query.length)}</span>
                      {fullName.slice(idx + query.length)}
                    </>
                  )
                }

                return (
                  <div
                    key={user.id}
                    className={`usd-item ${i === highlighted ? "active" : ""}`}
                    onMouseEnter={() => setHighlighted(i)}
                    onClick={() => handleSelect(user)}
                  >
                    <div className="usd-avatar">{initials}</div>
                    <div>
                      <div className="usd-name">
                        {renderName()}
                        {user.isOnline && <span className="usd-online-dot" />}
                      </div>
                      {user.email && <div className="usd-sub">{user.email}</div>}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="usd-divider" />

          {/* Footer */}
          <div className="usd-footer">
            <span className="usd-hint"><span className="usd-key">↑↓</span> navigate</span>
            <span className="usd-hint"><span className="usd-key">↵</span> select</span>
            <span className="usd-hint"><span className="usd-key">Esc</span> close</span>
            <span className="usd-count">{filtered.length} user{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>
    </>
  )
}