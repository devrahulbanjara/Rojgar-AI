import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ResumeResponse } from "@/types/resume";
import { resumeService } from "@/services/resumeService";
import { Loader2, FileText } from "lucide-react";

interface BasicInfoFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    resumeId: string;
    initialData: ResumeResponse;
    onSuccess: (updatedResume: ResumeResponse) => void;
}

export default function BasicInfoFormDialog({ open, onOpenChange, resumeId, initialData, onSuccess }: BasicInfoFormDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        resume_name: "",
        target_job_title: "",
        custom_summary: ""
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                resume_name: initialData.resume_name || "",
                target_job_title: initialData.target_job_title || "",
                custom_summary: initialData.custom_summary || ""
            });
        }
    }, [initialData, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const updated = await resumeService.updateResume(resumeId, formData);
            toast.success("Resume details updated");
            onSuccess(updated);
            onOpenChange(false);
        } catch (error) {
            toast.error("Failed to update resume details");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog isOpen={open} onClose={() => onOpenChange(false)} className="max-w-lg">
            <DialogHeader>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <DialogTitle>Edit Resume Details</DialogTitle>
                        <DialogDescription>
                            Update your resume name and target position
                        </DialogDescription>
                    </div>
                </div>
            </DialogHeader>

            <DialogContent className="pt-0">
                <form id="basic-info-form" onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                            Resume Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            value={formData.resume_name}
                            onChange={e => setFormData({ ...formData, resume_name: e.target.value })}
                            required
                            placeholder="e.g. My Software Engineer Resume"
                            className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Target Job Title</Label>
                        <Input
                            value={formData.target_job_title}
                            onChange={e => setFormData({ ...formData, target_job_title: e.target.value })}
                            placeholder="e.g. Senior Software Engineer"
                            className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Professional Summary</Label>
                        <Textarea
                            value={formData.custom_summary}
                            onChange={e => setFormData({ ...formData, custom_summary: e.target.value })}
                            className="min-h-[120px] resize-none rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                            placeholder="Write a brief summary of your professional background..."
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
                    form="basic-info-form"
                    disabled={loading}
                    className="rounded-xl px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25"
                >
                    {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Save Changes
                </Button>
            </DialogFooter>
        </Dialog>
    );
}
