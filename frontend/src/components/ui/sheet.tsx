"use client";

import * as React from "react"
import { cn } from "../../lib/utils"
import { X } from "lucide-react"

interface SheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
}

const SheetContext = React.createContext<{
    open: boolean
    setOpen: (open: boolean) => void
} | null>(null)

const Sheet: React.FC<SheetProps> = ({ open, onOpenChange, children }) => {
    return (
        <SheetContext.Provider value={{ open, setOpen: onOpenChange }}>
            {children}
        </SheetContext.Provider>
    )
}

const SheetContent: React.FC<{ children: React.ReactNode, className?: string, side?: "left" | "right" | "bottom" }> = ({ children, className, side = "right" }) => {
    const context = React.useContext(SheetContext)
    if (!context) throw new Error("SheetContent must be used within Sheet")

    if (!context.open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end">
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={() => context.setOpen(false)}
            />

            <div className={cn(
                "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out duration-300",
                side === "right" && "right-0 top-0 w-3/4 border-l sm:max-w-sm h-full",
                side === "left" && "left-0 top-0 w-3/4 border-r sm:max-w-sm h-full",
                side === "bottom" && "bottom-0 left-0 right-0 border-t rounded-t-xl",
                className
            )}>
                <button
                    type="button"
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary"
                    onClick={() => context.setOpen(false)}
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </button>
                {children}
            </div>
        </div>
    )
}

const SheetHeader: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}>
        {children}
    </div>
)

const SheetTitle: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <h2 className={cn("text-lg font-semibold text-foreground", className)}>
        {children}
    </h2>
)

const SheetDescription: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <p className={cn("text-sm text-muted-foreground", className)}>
        {children}
    </p>
)

const SheetFooter: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-auto", className)}>
        {children}
    </div>
)


export { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter }
