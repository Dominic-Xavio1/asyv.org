"use client"

import { useCallback, useRef, useState } from "react"
import { InteractiveButton } from "@/components/ui/interactive-button"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <InteractiveButton
            type="button"
            kind="ghost"
            variant="ghost"
            size="default"
            onClick={() => closeDialog(false)}
          >
            {dialogState.cancelText}
          </InteractiveButton>
          <InteractiveButton
            type="button"
            kind={dialogState.destructive ? "destructive" : "submit"}
            variant={dialogState.destructive ? "destructive" : "default"}
            size="default"
            onClick={() => closeDialog(true)}
            className={
              dialogState.destructive
                ? undefined
                : "bg-green-600 text-white hover:bg-green-700"
            }
          >
            {dialogState.confirmText}
          </InteractiveButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  return [confirm, dialog]
}
