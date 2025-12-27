import { useState, useEffect } from "react";
import { resumeService } from "@/services/resumeService";
import { ResumeResponse, ResumeUpdate } from "@/types/resume";
import {
    Dialog, DialogContent,
    DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Loader2, Plus, Trash2, Pencil, Check,
    Briefcase, GraduationCap, Sparkles
} from "lucide-react";
import { toast } from "sonner";

interface ResumeDetailModalProps {
    resumeId: string;
    onClose: () => void;
}

export function ResumeDetailModal({ resumeId, onClose }: ResumeDetailModalProps) {
    const [resume, setResume] = useState<ResumeResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // Form State for Basic Info
    const [formData, setFormData] = useState<ResumeUpdate>({});

    // Sub-Modal States
    const [showAddExperience, setShowAddExperience] = useState(false);

    useEffect(() => {
        if (resumeId) loadResume();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resumeId]);

    const loadResume = async () => {
        try {
            setLoading(true);
            const data = await resumeService.getResumeById(resumeId);
            setResume(data);
            setFormData({
                resume_name: data.resume_name,
                target_job_title: data.target_job_title || "",
                custom_summary: data.custom_summary || "",
            });
        } catch (error) {
            console.error("Failed to load resume", error);
            toast.error("Failed to load resume details");
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleSaveBasicInfo = async () => {
        try {
            const updated = await resumeService.updateResume(resumeId, formData);
            setResume(updated);
            setIsEditing(false);
            toast.success("Resume updated successfully");
        } catch (error) {
            console.error("Failed to update resume", error);
            toast.error("Failed to update resume");
        }
    };

    const handleDeleteExperience = async (expId: string) => {
        if (!confirm("Are you sure you want to delete this experience?")) return;
        try {
            await resumeService.deleteExperience(resumeId, expId);
            if (resume) {
                setResume({
                    ...resume,
                    work_experiences: resume.work_experiences.filter(e => e.resume_work_experience_id !== expId)
                });
            }
            toast.success("Experience removed");
        } catch {
            toast.error("Failed to delete experience");
        }
    };

    if (loading) {
        return (
            <Dialog isOpen={true} onClose={onClose} className="max-w-4xl">
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            </Dialog>
        );
    }

    return (
        <>
            <Dialog
                isOpen={true}
                onClose={onClose}
                className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
                showCloseButton={true}
            >
                {/* Header Section */}
                <div className="flex-shrink-0 px-8 pt-8 pb-6 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
                    <div className="flex justify-between items-start gap-6">
                        <div className="flex-1">
                            {isEditing ? (
                                <div className="space-y-5 animate-in fade-in duration-200">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                                            Resume Name
                                        </label>
                                        <Input
                                            value={formData.resume_name || ""}
                                            onChange={e => setFormData({ ...formData, resume_name: e.target.value })}
                                            className="text-lg font-semibold h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                                            placeholder="e.g. Senior Frontend Engineer"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                                            Target Role
                                        </label>
                                        <Input
                                            value={formData.target_job_title || ""}
                                            onChange={e => setFormData({ ...formData, target_job_title: e.target.value })}
                                            className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                                            placeholder="e.g. Product Manager"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                                            Professional Summary
                                        </label>
                                        <Textarea
                                            value={formData.custom_summary || ""}
                                            onChange={e => setFormData({ ...formData, custom_summary: e.target.value })}
                                            className="min-h-[100px] resize-none rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                                            placeholder="Write a brief professional summary..."
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <h1 className="text-2xl font-bold text-gray-900">{resume?.resume_name}</h1>
                                    <p className="text-lg text-blue-600 font-medium">{resume?.target_job_title}</p>
                                    {resume?.custom_summary && (
                                        <p className="text-gray-600 leading-relaxed text-sm mt-3 max-w-2xl">
                                            {resume.custom_summary}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <Button
                            onClick={() => isEditing ? handleSaveBasicInfo() : setIsEditing(true)}
                            className={`
                                gap-2 rounded-xl px-5 h-11 transition-all duration-200
                                ${isEditing
                                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25"
                                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                                }
                            `}
                            variant={isEditing ? "default" : "outline"}
                        >
                            {isEditing ? (
                                <><Check className="w-4 h-4" /> Save Changes</>
                            ) : (
                                <><Pencil className="w-4 h-4" /> Edit Resume</>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Content Sections (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-8 space-y-10 bg-white">

                    {/* Experience Section */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                    <Briefcase className="w-5 h-5 text-blue-600" />
                                </div>
                                <h2 className="text-lg font-semibold text-gray-900">Work Experience</h2>
                            </div>
                            {isEditing && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg gap-1.5"
                                    onClick={() => setShowAddExperience(true)}
                                >
                                    <Plus className="w-4 h-4" /> Add
                                </Button>
                            )}
                        </div>

                        <div className="space-y-6">
                            {resume?.work_experiences?.map((exp) => (
                                <div
                                    key={exp.resume_work_experience_id}
                                    className="group relative p-5 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-200 bg-white"
                                >
                                    {isEditing && (
                                        <button
                                            className="absolute right-3 top-3 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200"
                                            onClick={() => handleDeleteExperience(exp.resume_work_experience_id)}
                                            title="Remove this experience"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}

                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-gray-900 text-base">{exp.job_title}</h3>
                                        <span className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full whitespace-nowrap ml-4">
                                            {exp.start_date} - {exp.is_current ? "Present" : exp.end_date}
                                        </span>
                                    </div>
                                    <div className="text-blue-600 font-medium text-sm mb-3">
                                        {exp.company} {exp.location && `• ${exp.location}`}
                                    </div>
                                    {exp.description && (
                                        <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">
                                            {exp.description}
                                        </p>
                                    )}
                                </div>
                            ))}

                            {resume?.work_experiences?.length === 0 && (
                                <div className="text-center py-12 text-gray-400">
                                    <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-40" />
                                    <p className="text-sm">No experience added yet</p>
                                </div>
                            )}

                            {isEditing && (
                                <Button
                                    variant="outline"
                                    className="w-full border-dashed border-2 border-gray-200 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all duration-200 py-6 h-auto rounded-xl"
                                    onClick={() => setShowAddExperience(true)}
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Add Work Experience
                                </Button>
                            )}
                        </div>
                    </section>

                    {/* Education Section */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                    <GraduationCap className="w-5 h-5 text-emerald-600" />
                                </div>
                                <h2 className="text-lg font-semibold text-gray-900">Education</h2>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {resume?.educations?.map((edu) => (
                                <div
                                    key={edu.resume_education_id}
                                    className="p-5 rounded-xl border border-gray-100 hover:border-gray-200 transition-all duration-200"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{edu.college_name}</h3>
                                            <p className="text-gray-600 text-sm mt-0.5">{edu.degree}</p>
                                        </div>
                                        <span className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                                            {edu.start_date} - {edu.is_current ? "Present" : edu.end_date}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {resume?.educations?.length === 0 && (
                                <div className="text-center py-12 text-gray-400">
                                    <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-40" />
                                    <p className="text-sm">No education added yet</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Skills Section */}
                    {resume?.skills && resume.skills.length > 0 && (
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-violet-600" />
                                </div>
                                <h2 className="text-lg font-semibold text-gray-900">Skills</h2>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {resume.skills.map((skill) => (
                                    <span
                                        key={skill.resume_skill_id}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-150 text-gray-700 rounded-lg text-sm font-medium transition-colors duration-200"
                                    >
                                        {skill.skill_name}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </Dialog>

            {/* Add Experience Modal */}
            <AddExperienceDialog
                isOpen={showAddExperience}
                onClose={() => setShowAddExperience(false)}
                resumeId={resumeId}
                onAdded={loadResume}
            />
        </>
    );
}

// --- Add Experience Dialog ---
function AddExperienceDialog({
    isOpen,
    onClose,
    resumeId,
    onAdded
}: {
    isOpen: boolean;
    onClose: () => void;
    resumeId: string;
    onAdded: () => void;
}) {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const newExp = {
            job_title: formData.get("job_title") as string,
            company: formData.get("company") as string,
            location: formData.get("location") as string,
            start_date: formData.get("start_date") as string,
            end_date: formData.get("end_date") as string,
            is_current: formData.get("is_current") === "on",
            description: formData.get("description") as string,
        };

        try {
            await resumeService.addExperience(resumeId, newExp);
            toast.success("Experience added successfully");
            onAdded();
            onClose();
        } catch {
            toast.error("Failed to add experience");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} className="max-w-xl">
            <DialogHeader>
                <DialogTitle>Add Work Experience</DialogTitle>
                <DialogDescription>
                    Add your work history to showcase your professional background
                </DialogDescription>
            </DialogHeader>

            <DialogContent className="pt-2">
                <form id="add-exp-form" onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Job Title <span className="text-red-500">*</span>
                            </label>
                            <Input
                                name="job_title"
                                required
                                placeholder="e.g. Software Engineer"
                                className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Company <span className="text-red-500">*</span>
                            </label>
                            <Input
                                name="company"
                                required
                                placeholder="e.g. Acme Corp"
                                className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Location</label>
                        <Input
                            name="location"
                            placeholder="e.g. New York, NY"
                            className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Start Date <span className="text-red-500">*</span>
                            </label>
                            <Input
                                name="start_date"
                                type="date"
                                required
                                className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">End Date</label>
                            <Input
                                name="end_date"
                                type="date"
                                className="h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="is_current"
                            name="is_current"
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="is_current" className="text-sm text-gray-700">
                            I currently work here
                        </label>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Description</label>
                        <Textarea
                            name="description"
                            placeholder="Describe your responsibilities and achievements..."
                            rows={4}
                            className="resize-none rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                        />
                    </div>
                </form>
            </DialogContent>

            <DialogFooter>
                <Button
                    variant="outline"
                    onClick={onClose}
                    type="button"
                    className="rounded-xl px-5"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    form="add-exp-form"
                    disabled={loading}
                    className="rounded-xl px-6 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25"
                >
                    {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Add Experience
                </Button>
            </DialogFooter>
        </Dialog>
    );
}
