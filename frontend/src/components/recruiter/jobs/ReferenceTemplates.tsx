"use client";

import * as React from "react"
import {
    FileText,
    Copy,
    Clock,
    ChevronRight,
    Search
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../ui/dialog"
import { Card } from "../../ui/card"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { Badge } from "../../ui/badge"


interface ReferenceTemplatesProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (template: any) => void
}

const templates = [
    {
        id: 1,
        name: "Standard Engineering Role",
        sections: ["Role Overview", "Key Responsibilities", "Tech Stack", "Requirements"],
        usedCount: 124,
        lastUpdated: "2 days ago",
        category: "Engineering"
    },
    {
        id: 2,
        name: "Senior Product Manager",
        sections: ["Product Vision", "Team Leadership", "Strategy", "Requirements"],
        usedCount: 45,
        lastUpdated: "1 week ago",
        category: "Product"
    },
    {
        id: 3,
        name: "Sales Representative",
        sections: ["About the Role", "What You'll Sell", "Quotas & Comps", "Requirements"],
        usedCount: 89,
        lastUpdated: "1 month ago",
        category: "Sales"
    },
    {
        id: 4,
        name: "Marketing Specialist",
        sections: ["Campaign Management", "Content Strategy", "Analytics", "Requirements"],
        usedCount: 32,
        lastUpdated: "3 weeks ago",
        category: "Marketing"
    }
]

export const ReferenceTemplates: React.FC<ReferenceTemplatesProps> = ({ isOpen, onClose, onSelect }) => {
    const [searchTerm, setSearchTerm] = React.useState("")

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <Dialog isOpen={isOpen} onClose={onClose} className="max-w-4xl">
            <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Reference Templates</DialogTitle>
                    <DialogDescription>
                        Choose a tested job description structure to start fast.
                    </DialogDescription>
                    <div className="relative mt-4">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search templates..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredTemplates.map(template => (
                            <Card key={template.id} className="group cursor-pointer hover:border-primary transition-all hover:shadow-md">
                                <div className="p-5 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <h3 className="font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                                                <FileText className="h-4 w-4" />
                                                {template.name}
                                            </h3>
                                            <Badge variant="secondary" className="text-xs">{template.category}</Badge>
                                        </div>
                                        <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onSelect(template)}>
                                            Select <ChevronRight className="ml-1 h-3 w-3" />
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Structure</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {template.sections.map(section => (
                                                <span key={section} className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs text-muted-foreground border">
                                                    {section}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                                        <div className="flex items-center gap-1">
                                            <Copy className="h-3 w-3" /> Used {template.usedCount} times
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> Updated {template.lastUpdated}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t bg-muted/50 flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Can't find what you need?</span>
                    <Button variant="outline" size="sm">
                        + Create New Template
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
