"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { API_CONFIG } from "@/config/constants";
import { Loader2, Briefcase } from "lucide-react";

interface ExperienceFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    resumeId: string;
    initialData?: any;
    onSuccess: () => void;
}

export default function ExperienceFormDialog({ open, onOpenChange, resumeId, initialData, onSuccess }: ExperienceFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        job_title: "",
        company: "",
        location: "",
        start_date: "",
        end_date: "",
        is_current: false,
        description: ""
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                setFormData({
                    job_title: initialData.job_title || "",
                    company: initialData.company || "",
                    location: initialData.location || "",
                    start_date: initialData.start_date || "",
                    end_date: initialData.end_date || "",
                    is_current: initialData.is_current || false,
                    description: initialData.description || ""
                });
            } else {
                setFormData({ job_title: "", company: "", location: "", start_date: "", end_date: "", is_current: false, description: "" });
            }
        }
    }, [open, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const isEdit = !!initialData;
            const url = isEdit
                ? `${API_CONFIG.baseUrl}/api/v1/resumes/${resumeId}/experience/${initialData.resume_work_experience_id}`
                : `${API_CONFIG.baseUrl}/api/v1/resumes/${resumeId}/experience`;

            const method = isEdit ? 'PATCH' : 'POST';

            const payload = {
                ...formData,
                location: formData.location || null,
                start_date: formData.start_date || null,
                end_date: formData.end_date || null,
                description: formData.description || null
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to save");

            toast.success(isEdit ? "Experience updated" : "Experience added");
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
        <Dialog isOpen={open} onClose={() => onOpenChange(false)} className="max-w-xl">
            <DialogHeader>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <DialogTitle>{initialData ? "Edit Work Experience" : "Add Work Experience"}</DialogTitle>
                        <DialogDescription>
                            {initialData ? "Update your work history details" : "Add your professional experience"}
                        </DialogDescription>
                    </div>
                </div>
            </DialogHeader>

            <DialogContent className="pt-0">
                <form id="experience-form" onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">
                                Job Title <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                required
                                value={formData.job_title}
                                onChange={e => setFormData({ ...formData, job_title: e.target.value })}
                                placeholder="e.g. Senior Developer"
                                className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">
                                Company <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                required
                                value={formData.company}
                                onChange={e => setFormData({ ...formData, company: e.target.value })}
                                placeholder="e.g. Acme Inc."
                                className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Location</Label>
                        <Input
                            value={formData.location}
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                            placeholder="e.g. New York, NY (Remote)"
                            className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Start Date</Label>
                            <Input
                                type="date"
                                value={formData.start_date}
                                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">End Date</Label>
                            <Input
                                type="date"
                                disabled={formData.is_current}
                                value={formData.end_date}
                                onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 disabled:opacity-50"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 py-1">
                        <Checkbox
                            id="current"
                            checked={formData.is_current}
                            onCheckedChange={(c) => setFormData({ ...formData, is_current: c as boolean })}
                            className="rounded border-gray-300"
                        />
                        <label htmlFor="current" className="text-sm text-gray-700 cursor-pointer">
                            I currently work here
                        </label>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Description</Label>
                        <Textarea
                            className="min-h-[120px] resize-none rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                            placeholder="Describe your achievements and responsibilities..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
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
                    form="experience-form"
                    disabled={loading}
                    className="rounded-xl px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25"
                >
                    {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    {initialData ? "Save Changes" : "Add Experience"}
                </Button>
            </DialogFooter>
        </Dialog>
    );
}
