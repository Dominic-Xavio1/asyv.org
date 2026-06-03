"use client"

import { useCallback, useRef, useState } from "react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
} from "./alert-dialog"

export function useConfirmDialog() {
  const resolveRef = useRef(null)
  const [dialogState, setDialogState] = useState({
    open: false,
    title: "Confirm",
    description: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    destructive: false,
  })

  const closeDialog = useCallback((confirmed) => {
    const resolve = resolveRef.current
    resolveRef.current = null
    setDialogState((prev) => ({ ...prev, open: false }))
    if (resolve) {
      resolve(confirmed)
    }
  }, [])

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve
      setDialogState({
        open: true,
        title: options.title || "Confirm",
        description: options.description || "",
        confirmText: options.confirmText || "Confirm",
        cancelText: options.cancelText || "Cancel",
        destructive: options.destructive ?? false,
      })
    })
  }, [])

  const dialog = (
    <AlertDialog
      open={dialogState.open}
      onOpenChange={(open) => {
        if (!open) {
          closeDialog(false)
        } else {
          setDialogState((prev) => ({ ...prev, open: true }))
        }
      }}
    >
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>{dialogState.title}</AlertDialogTitle>
          {dialogState.description ? (
            <AlertDialogDescription>{dialogState.description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel type="button" onClick={() => closeDialog(false)}>
            {dialogState.cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            type="button"
            onClick={() => closeDialog(true)}
            className={
              dialogState.destructive
                ? "bg-destructive text-white hover:bg-destructive/90"
                : "bg-green-600 text-white hover:bg-green-700"
            }
          >
            {dialogState.confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  return [confirm, dialog]
}
