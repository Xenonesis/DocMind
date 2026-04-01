"use client"

import { toast as sonnerToast } from "sonner"
import * as React from "react"

export interface ToastProps {
  id?: string | number
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  variant?: "default" | "destructive"
  duration?: number
}

function toast({ variant, title, description, action, duration, id: predefinedId }: ToastProps) {
  const options: any = {
    duration,
    id: predefinedId,
  }
  
  if (action) {
    options.action = action;
  }

  const mainMessage = title || description || "";
  if (title && description) {
    options.description = description;
  }

  let id;
  const tStr = mainMessage.toString().toLowerCase();
  
  if (variant === "destructive" || tStr.includes("fail") || tStr.includes("error") || tStr.includes("required") || tStr.includes("invalid") || tStr.includes("denied") || tStr.includes("wrong")) {
    id = sonnerToast.error(mainMessage, options);
  } else if (
    tStr.includes("success") || 
    tStr.includes("updated") || 
    tStr.includes("created") || 
    tStr.includes("ready") || 
    tStr.includes("copied") ||
    tStr.includes("checked") ||
    tStr.includes("noted") ||
    tStr.includes("started") ||
    tStr.includes("loaded") ||
    tStr.includes("activated") ||
    tStr.includes("deactivated") ||
    tStr.includes("revoked") ||
    tStr.includes("saved") ||
    tStr.includes("changed") ||
    tStr.includes("deleted")
  ) {
    id = sonnerToast.success(mainMessage, options);
  } else {
    id = sonnerToast(mainMessage, options);
  }

  return {
    id,
    dismiss: () => sonnerToast.dismiss(id),
    update: (newProps: ToastProps) => toast({ ...newProps, id: id as string })
  }
}

function useToast() {
  return {
    toast,
    dismiss: (toastId?: string | number) => sonnerToast.dismiss(toastId),
    toasts: [] as any[]
  }
}

export { useToast, toast }