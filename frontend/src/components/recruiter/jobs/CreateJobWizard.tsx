"use client";

import * as React from "react"
import {
    ArrowRight,
    Sparkles,
    Check,
    FileText,
    AlertCircle,
    Loader2,
    ChevronLeft,
    DollarSign,
    Edit
} from "lucide-react"
import { Button } from "../../ui/button"
import { Progress } from "../../ui/progress"
import { Card } from "../../ui/card"
import { Textarea } from "../../ui/textarea"
import { Input } from "../../ui/input"
import { Badge } from "../../ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select"
import { Dialog, DialogContent } from "../../ui/dialog"
import { cn } from "../../../lib/utils"

interface CreateJobWizardProps {
    onClose: () => void
    onPublish: (jobData: any) => void
}

const steps = [
    { id: 1, name: "Requirements" },
    { id: 2, name: "AI Generation" },
    { id: 3, name: "Review & Edit" },
    { id: 4, name: "Finalize" }
]

export const CreateJobWizard: React.FC<CreateJobWizardProps> = ({ onClose, onPublish }) => {
    const [currentStep, setCurrentStep] = React.useState(1)
    const [loading, setLoading] = React.useState(false)
    const [loadingText, setLoadingText] = React.useState("Analyzing requirements...")
    const [requirements, setRequirements] = React.useState("")
    const [generatedDraft, setGeneratedDraft] = React.useState<any>(null)
    const [finalDetails, setFinalDetails] = React.useState({
        title: "Senior Software Engineer",
        department: "Engineering",
        location: "",
        salaryMin: "",
        salaryMax: "",
    })

    // Simulated AI Generation
    const handleGenerate = async () => {
        setLoading(true)
        setCurrentStep(2)

        const texts = ["Analyzing requirements...", "Crafting company overview...", "Defining role expectations...", "Polishing language..."]
        let i = 0

        const interval = setInterval(() => {
            i++
            if (i < texts.length) setLoadingText(texts[i])
        }, 1500)

        await new Promise(resolve => setTimeout(resolve, 6000))

        clearInterval(interval)
        setLoading(false)
        setGeneratedDraft({
            overview: "We are looking for a talented Senior Engineer...",
            responsibilities: [
                "Architect scalable solutions",
                "Mentor junior developers",
                "Drive technical decisions"
            ],
            requirements: [
                "5+ years of React experience",
                "Deep understanding of system design",
                "Experience with cloud infrastructure"
            ]
        })
        setCurrentStep(3)
    }

    const handlePublish = () => {
        onPublish({
            ...finalDetails,
            description: generatedDraft.overview,
            status: 'active'
        })
    }

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in fade-in slide-in-from-bottom-10">
            {/* Header Stepper */}
            <div className="border-b px-8 py-4 bg-card/50 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-transparent pl-0">
                            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                        </Button>
                        <div className="text-sm font-medium text-muted-foreground">
                            Step {currentStep} of 4: <span className="text-foreground">{steps[currentStep - 1].name}</span>
                        </div>
                    </div>
                    <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                            className="absolute h-full bg-gradient-to-r from-blue-600 to-green-500 transition-all duration-500 ease-in-out"
                            style={{ width: `${(currentStep / 4) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto py-12 px-8">
                <div className="max-w-3xl mx-auto">

                    {/* Step 1: Requirements */}
                    {currentStep === 1 && (
                        <Card className="p-8 shadow-xl border-t-4 border-t-primary">
                            <div className="mb-8 text-center space-y-2">
                                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                                    Describe Your Ideal Candidate
                                </h1>
                                <p className="text-muted-foreground">
                                    Our AI will transform your rough notes into a professional job description.
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Core Requirements & Notes</label>
                                    <Textarea
                                        placeholder="e.g., Senior ML Engineer, 4+ years experience, mentoring students, AWS certification focus, 50% engineering/50% training..."
                                        className="min-h-[200px] text-lg resize-none p-4 focus-visible:ring-primary/20"
                                        value={requirements}
                                        onChange={(e) => setRequirements(e.target.value)}
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Try to mention role, experience, and key skills.</span>
                                        <span>{requirements.length} chars</span>
                                    </div>
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex gap-3 text-blue-700 dark:text-blue-300">
                                    <AlertCircle className="h-5 w-5 shrink-0" />
                                    <p className="text-sm">
                                        <strong>Tip:</strong> You can paste existing JD content or just bullet points. The AI is smart enough to structure it properly.
                                    </p>
                                </div>

                                <Button
                                    className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.01]"
                                    onClick={handleGenerate}
                                    disabled={requirements.length < 10}
                                >
                                    <Sparkles className="mr-2 h-5 w-5" /> Generate Job Description
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* Step 2: Loading */}
                    {currentStep === 2 && (
                        <div className="flex flex-col items-center justify-center space-y-8 py-20">
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full animate-pulse" />
                                <Loader2 className="h-16 w-16 text-primary animate-spin relative z-10" />
                            </div>
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-bold animate-pulse duration-1000">
                                    {loadingText}
                                </h2>
                                <p className="text-muted-foreground">This usually takes about 5-10 seconds.</p>
                            </div>
                            <Progress value={66} className="w-64 h-2" />
                        </div>
                    )}

                    {/* Step 3: Review */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold">Review Generated Draft</h2>
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                                    Draft v1
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Draft Content */}
                                <div className="space-y-6">
                                    <Card className="p-6 space-y-4 border-l-4 border-l-green-500">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-lg">Role Overview</h3>
                                            <Button variant="ghost" size="icon" className="h-6 w-6"><Edit className="h-3 w-3" /></Button>
                                        </div>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {generatedDraft?.overview}
                                        </p>
                                    </Card>

                                    <Card className="p-6 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-lg">Key Responsibilities</h3>
                                            <Button variant="ghost" size="icon" className="h-6 w-6"><Edit className="h-3 w-3" /></Button>
                                        </div>
                                        <ul className="space-y-2">
                                            {generatedDraft?.responsibilities.map((item: string, i: number) => (
                                                <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                                                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </Card>
                                </div>

                                {/* Comparison/Feedback */}
                                <div className="space-y-6">
                                    <Card className="p-6 bg-slate-50 dark:bg-slate-900 border-dashed">
                                        <h3 className="font-semibold text-sm text-muted-foreground mb-4 uppercase tracking-wider">Original Inputs</h3>
                                        <p className="text-sm italic text-muted-foreground">"{requirements}"</p>
                                    </Card>

                                    <div className="space-y-3">
                                        <label className="text-sm font-medium">Refinement Request</label>
                                        <div className="flex gap-2">
                                            <Input placeholder="e.g. Make it more formal, emphasize leadership..." />
                                            <Button variant="secondary">Refine</Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 pt-8 border-t">
                                <Button variant="outline" onClick={() => setCurrentStep(1)}>Back</Button>
                                <Button onClick={() => setCurrentStep(4)}>Approve & Continue</Button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Finalize */}
                    {currentStep === 4 && (
                        <Card className="p-8 max-w-2xl mx-auto">
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold mb-2">Final Details</h2>
                                <p className="text-muted-foreground">Add the operational details to your job posting.</p>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Department</label>
                                        <Select defaultValue={finalDetails.department} onValueChange={(v) => setFinalDetails({ ...finalDetails, department: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Engineering">Engineering</SelectItem>
                                                <SelectItem value="Product">Product</SelectItem>
                                                <SelectItem value="Design">Design</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Location</label>
                                        <Input
                                            placeholder="e.g. San Francisco"
                                            value={finalDetails.location}
                                            onChange={(e) => setFinalDetails({ ...finalDetails, location: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Min Salary</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input className="pl-8" type="number" placeholder="100000" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Max Salary</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input className="pl-8" type="number" placeholder="180000" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-4">
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" className="rounded border-gray-300" />
                                        <span className="text-sm">Save this format as Reference Template</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                                <Button variant="ghost" onClick={() => setCurrentStep(3)}>Back</Button>
                                <Button variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50 hover:bg-yellow-100">Save as Draft</Button>
                                <Button
                                    className="bg-green-600 hover:bg-green-700 text-white min-w-[140px]"
                                    onClick={handlePublish}
                                >
                                    Publish Job
                                </Button>
                            </div>
                        </Card>
                    )}

                </div>
            </div>
        </div>
    )
}
