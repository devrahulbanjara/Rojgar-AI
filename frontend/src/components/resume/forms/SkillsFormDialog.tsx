"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { API_CONFIG } from "@/config/constants";
import { Loader2, Sparkles } from "lucide-react";

interface SkillsFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    resumeId: string;
    initialData?: { resume_skill_id: string; skill_name: string };
    onSuccess: () => void;
}

export default function SkillsFormDialog({ open, onOpenChange, resumeId, initialData, onSuccess }: SkillsFormProps) {
    const [loading, setLoading] = useState(false);
    const [skillName, setSkillName] = useState("");

    useEffect(() => {
        if (open) {
            setSkillName(initialData?.skill_name || "");
        }
    }, [open, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const isEdit = !!initialData;
            const url = isEdit
                ? `${API_CONFIG.baseUrl}/api/v1/resumes/${resumeId}/skills/${initialData.resume_skill_id}`
                : `${API_CONFIG.baseUrl}/api/v1/resumes/${resumeId}/skills`;

            const method = isEdit ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ skill_name: skillName })
            });

            if (!res.ok) throw new Error("Failed to save skill");

            toast.success(isEdit ? "Skill updated" : "Skill added");
            onSuccess();
            onOpenChange(false);
        } catch (err) {
            console.error(err);
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog isOpen={open} onClose={() => onOpenChange(false)} className="max-w-md">
            <DialogHeader>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                        <DialogTitle>{initialData ? "Edit Skill" : "Add Skill"}</DialogTitle>
                        <DialogDescription>
                            {initialData ? "Update your skill" : "Add a new skill to your resume"}
                        </DialogDescription>
                    </div>
                </div>
            </DialogHeader>

            <DialogContent className="pt-0">
                <form id="skill-form" onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                            Skill Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            required
                            value={skillName}
                            onChange={e => setSkillName(e.target.value)}
                            placeholder="e.g. Python, React, Leadership"
                            autoFocus
                            className="h-11 rounded-xl border-gray-200 focus:border-violet-500 focus:ring-violet-500/20"
                        />
                    </div>
                </form>
            </DialogContent>

            <DialogFooter>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="rounded-xl px-5"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    form="skill-form"
                    disabled={loading}
                    className="rounded-xl px-6 bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/25"
                >
                    {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    {initialData ? "Save Changes" : "Add Skill"}
                </Button>
            </DialogFooter>
        </Dialog>
    );
}
