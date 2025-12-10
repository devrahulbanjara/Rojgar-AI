"use client";

import * as React from "react"
import { cn } from "../../lib/utils"

const DropdownMenuContext = React.createContext<{
    open: boolean
    setOpen: (open: boolean) => void
} | null>(null)

const DropdownMenu: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [open, setOpen] = React.useState(false)

    return (
        <DropdownMenuContext.Provider value={{ open, setOpen }}>
            <div className="relative inline-block text-left">
                {children}
            </div>
        </DropdownMenuContext.Provider>
    )
}

const DropdownMenuTrigger: React.FC<{ children: React.ReactNode, asChild?: boolean, className?: string }> = ({ children, className }) => {
    const context = React.useContext(DropdownMenuContext)
    if (!context) throw new Error("DropdownMenuTrigger must be used within DropdownMenu")

    return (
        <div onClick={() => context.setOpen(!context.open)} className={cn("cursor-pointer", className)}>
            {children}
        </div>
    )
}

const DropdownMenuContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { align?: "start" | "end" | "center" }
>(({ className, children, align = "end", ...props }, ref) => {
    const context = React.useContext(DropdownMenuContext)
    if (!context) throw new Error("DropdownMenuContent must be used within DropdownMenu")

    if (!context.open) return null

    const alignClass = align === "end" ? "right-0" : align === "start" ? "left-0" : "left-1/2 -translate-x-1/2"

    return (
        <>
            <div className="fixed inset-0 z-40" onClick={() => context.setOpen(false)} />
            <div
                ref={ref}
                className={cn(
                    "absolute z-50 mt-2 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-80 zoom-in-95",
                    alignClass,
                    className
                )}
                {...props}
            >
                {children}
            </div>
        </>
    )
})
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuItem = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
    const context = React.useContext(DropdownMenuContext)

    return (
        <div
            ref={ref}
            className={cn(
                "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer",
                className
            )}
            onClick={(e) => {
                props.onClick?.(e)
                context?.setOpen(false)
            }}
            {...props}
        />
    )
})
DropdownMenuItem.displayName = "DropdownMenuItem"

const DropdownMenuLabel: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <div className={cn("px-2 py-1.5 text-sm font-semibold", className)}>
        {children}
    </div>
)

const DropdownMenuSeparator: React.FC<{ className?: string }> = ({ className }) => (
    <div className={cn("-mx-1 my-1 h-px bg-muted", className)} />
)

export {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
}
