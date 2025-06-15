"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg group-[.toaster]:p-4",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-md group-[.toast]:font-medium group-[.toast]:shadow-sm group-[.toast]:transition-all group-[.toast]:hover:opacity-90",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-md group-[.toast]:font-medium group-[.toast]:shadow-sm group-[.toast]:transition-all group-[.toast]:hover:opacity-90",
          title: "group-[.toast]:font-semibold group-[.toast]:text-base",
          error: "group-[.toast]:border-l-4 group-[.toast]:border-l-destructive",
          success: "group-[.toast]:border-l-4 group-[.toast]:border-l-green-500",
          warning: "group-[.toast]:border-l-4 group-[.toast]:border-l-yellow-500",
          info: "group-[.toast]:border-l-4 group-[.toast]:border-l-blue-500",
        },
      }}
      closeButton
      richColors
      expand
      position="top-right"
      duration={5000}
      {...props}
    />
  )
}

export { Toaster }
