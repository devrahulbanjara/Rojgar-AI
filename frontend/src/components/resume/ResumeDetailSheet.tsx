"use client";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pencil, Trash2, Plus, Briefcase, GraduationCap, Code, Award, ExternalLink, Calendar, MapPin, Building } from "lucide-react";
import { useState, useEffect } from "react";
import ExperienceFormDialog from "./forms/ExperienceFormDialog";
import EducationFormDialog from "./forms/EducationFormDialog";
import SkillsFormDialog from "./forms/SkillsFormDialog";
import CertificationFormDialog from "./forms/CertificationFormDialog";
import BasicInfoFormDialog from './forms/BasicInfoFormDialog';
import { toast } from "sonner";
import { API_CONFIG } from "@/config/constants";
import { ResumeResponse, ResumeWorkExperienceResponse, ResumeEducationResponse, ResumeCertificationResponse } from "@/types/resume";

interface ResumeDetailSheetProps {
    resumeId: string | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

type FormType = "experience" | "education" | "skills" | "certification" | null;

export default function ResumeDetailSheet({ resumeId, isOpen, onClose, onUpdate }: ResumeDetailSheetProps) {
    const [resume, setResume] = useState<ResumeResponse | null>(null);
    const [loading, setLoading] = useState(false);

    // State for managing forms
    const [activeForm, setActiveForm] = useState<FormType>(null);
    const [editingItem, setEditingItem] = useState<ResumeWorkExperienceResponse | ResumeEducationResponse | ResumeCertificationResponse | null>(null);

    const [isCertificationOpen, setIsCertificationOpen] = useState(false);
    const [editingCertification, setEditingCertification] = useState<ResumeCertificationResponse | null>(null);

    const [isBasicInfoOpen, setIsBasicInfoOpen] = useState(false);

    const fetchResume = async () => {
        if (!resumeId) {
            setResume(null);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_CONFIG.baseUrl}/api/v1/resumes/${resumeId}`, {
                credentials: 'include',
            });
            if (!res.ok) throw new Error("Failed to fetch resume details");
            const data: ResumeResponse = await res.json();
            setResume(data);
        } catch (error) {
            console.error("Error fetching resume details:", error);
            toast.error("Failed to load resume details.");
            setResume(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && resumeId) {
            fetchResume();
        } else if (!isOpen) {
            setResume(null);
            setActiveForm(null);
            setEditingItem(null);
            setIsBasicInfoOpen(false);
            setIsCertificationOpen(false);
            setEditingCertification(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, resumeId]);

    const handleDelete = async (type: string, id: string) => {
        if (!confirm("Are you sure you want to remove this item?")) return;
        try {
            // API endpoints for deletion need to be consistent with backend
            // Assuming: /api/v1/resumes/:resumeId/:type/:itemId
            const res = await fetch(`${API_CONFIG.baseUrl}/api/v1/resumes/${resume?.resume_id}/${type}/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (!res.ok) throw new Error("Failed");
            toast.success("Item removed");
            toast.success("Item removed");
            fetchResume();
            onUpdate();
        } catch {
            toast.error("Failed to delete item");
        }
    };

    const handleEdit = (type: FormType, item: ResumeWorkExperienceResponse | ResumeEducationResponse | ResumeCertificationResponse) => {
        if (type === "certification") {
            setEditingCertification(item as ResumeCertificationResponse);
            setIsCertificationOpen(true);
        } else if (type === "experience") {
            setEditingItem(item as ResumeWorkExperienceResponse);
            setActiveForm(type);
        } else if (type === "education") {
            setEditingItem(item as ResumeEducationResponse);
            setActiveForm(type);
        }
    };

    const handleAdd = (type: FormType) => {
        if (type === "certification") {
            setEditingCertification(null);
            setIsCertificationOpen(true);
        } else {
            setEditingItem(null);
            setActiveForm(type);
        }
    };

    const handleFormSuccess = () => {
        fetchResume();
        onUpdate();
        setActiveForm(null);
        setEditingItem(null);
        setIsBasicInfoOpen(false);
        setIsCertificationOpen(false);
        setEditingCertification(null);
    };

    if (!resume || loading) {
        return (
            <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <SheetContent className="w-full sm:max-w-2xl lg:max-w-3xl p-0 bg-white border-l">
                    <div className="h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <>
            <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()} hideClose={true}>
                <SheetContent className="w-full sm:max-w-2xl lg:max-w-3xl p-0 bg-white flex flex-col shadow-2xl border-l">
                    {/* Header */}
                    <div className="px-8 py-6 border-b bg-gray-50 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 group">
                                <h2 className="text-2xl font-bold text-gray-900">{resume.resume_name}</h2>
                                <button
                                    onClick={() => setIsBasicInfoOpen(true)}
                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition opacity-0 group-hover:opacity-100"
                                    title="Edit Basic Info"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-gray-500 text-lg">{resume.target_job_title}</p>
                            <div className="mt-2 text-sm text-gray-400">
                                {resume.custom_summary && <p className="line-clamp-2 max-w-xl">{resume.custom_summary}</p>}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsBasicInfoOpen(true)}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition border border-gray-200 bg-white"
                                title="Edit Details"
                            >
                                <Pencil className="w-5 h-5" />
                            </button>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                            >
                                Done
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <ScrollArea className="flex-1">
                        <div className="p-6 space-y-10 pb-20">

                            {/* --- EXPERIENCE SECTION --- */}
                            <section>
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                                        <div className="p-1.5 bg-blue-100 rounded-md text-blue-600">
                                            <Briefcase className="w-4 h-4" />
                                        </div>
                                        Work Experience
                                    </h3>
                                    <Button variant="ghost" size="sm" onClick={() => handleAdd("experience")} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                        <Plus className="w-4 h-4 mr-1" /> Add
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {resume.work_experiences.length === 0 && (
                                        <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                            <p className="text-slate-400 text-sm">No work experience added yet.</p>
                                        </div>
                                    )}

                                    {resume.work_experiences.map((exp) => (
                                        <div key={exp.resume_work_experience_id} className="group relative bg-white border rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => handleEdit("experience", exp)}>
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => handleDelete("experience", exp.resume_work_experience_id)}>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>

                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 mb-2">
                                                <div>
                                                    <h4 className="font-semibold text-slate-900 text-base">{exp.job_title}</h4>
                                                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                                        <Building className="w-3.5 h-3.5" />
                                                        {exp.company}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-start sm:items-end text-xs text-slate-500 mt-1 sm:mt-0">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {exp.start_date} - {exp.is_current ? "Present" : exp.end_date}
                                                    </div>
                                                    {exp.location && (
                                                        <div className="flex items-center gap-1 mt-0.5">
                                                            <MapPin className="w-3 h-3" />
                                                            {exp.location}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {exp.description && (
                                                <p className="text-sm text-slate-600 mt-3 whitespace-pre-line leading-relaxed border-t pt-3">
                                                    {exp.description}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <hr className="border-slate-100" />

                            {/* --- EDUCATION SECTION --- */}
                            <section>
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                                        <div className="p-1.5 bg-emerald-100 rounded-md text-emerald-600">
                                            <GraduationCap className="w-4 h-4" />
                                        </div>
                                        Education
                                    </h3>
                                    <Button variant="ghost" size="sm" onClick={() => handleAdd("education")} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                        <Plus className="w-4 h-4 mr-1" /> Add
                                    </Button>
                                </div>
                                <div className="space-y-4">
                                    {resume.educations.map(edu => (
                                        <div key={edu.resume_education_id} className="group relative bg-white border rounded-xl p-5 hover:border-emerald-300 hover:shadow-md transition-all duration-200">
                                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => handleEdit("education", edu)}>
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => handleDelete("education", edu.resume_education_id)}>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>

                                            <h4 className="font-semibold text-slate-900">{edu.college_name}</h4>
                                            <p className="text-slate-700 text-sm">{edu.degree}</p>
                                            <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {edu.start_date} - {edu.is_current ? 'Present' : edu.end_date}</span>
                                                {edu.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {edu.location}</span>}
                                            </div>
                                        </div>
                                    ))}
                                    {resume.educations.length === 0 && (
                                        <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                            <p className="text-slate-400 text-sm">No education listed.</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            <hr className="border-slate-100" />

                            {/* --- SKILLS SECTION --- */}
                            <section>
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                                        <div className="p-1.5 bg-indigo-100 rounded-md text-indigo-600">
                                            <Code className="w-4 h-4" />
                                        </div>
                                        Skills
                                    </h3>
                                    <Button variant="ghost" size="sm" onClick={() => handleAdd("skills")} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                        <Plus className="w-4 h-4 mr-1" /> Add
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {resume.skills.map(s => (
                                        <div key={s.resume_skill_id} className="group flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-sm text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 transition-colors cursor-default">
                                            <span>{s.skill_name}</span>
                                            <button
                                                onClick={() => handleDelete("skills", s.resume_skill_id)}
                                                className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity -mr-1"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                    {resume.skills.length === 0 && (
                                        <span className="text-slate-400 text-sm italic py-2">No skills listed.</span>
                                    )}
                                </div>
                            </section>

                            <hr className="border-slate-100" />

                            {/* --- CERTIFICATIONS SECTION --- */}
                            <section>
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                                        <div className="p-1.5 bg-amber-100 rounded-md text-amber-600">
                                            <Award className="w-4 h-4" />
                                        </div>
                                        Certifications
                                    </h3>
                                    <Button variant="ghost" size="sm" onClick={() => handleAdd("certification")} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                        <Plus className="w-4 h-4 mr-1" /> Add
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {resume.certifications.map(cert => (
                                        <div key={cert.resume_certification_id} className="group relative flex items-center justify-between p-4 bg-white border rounded-lg hover:border-amber-300 transition-colors">
                                            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-blue-600" onClick={() => handleEdit("certification", cert)}>
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-red-600" onClick={() => handleDelete("certifications", cert.resume_certification_id)}>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>

                                            <div>
                                                <h4 className="font-semibold text-slate-900">{cert.certification_name}</h4>
                                                <p className="text-sm text-slate-600">{cert.issuing_body}</p>
                                                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                                                    <span>Issued: {cert.issue_date}</span>
                                                    {!cert.does_not_expire && <span>Expires: {cert.expiration_date}</span>}
                                                </div>
                                            </div>
                                            {cert.credential_url && (
                                                <a href={cert.credential_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 p-2">
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                    {resume.certifications.length === 0 && (
                                        <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                            <p className="text-slate-400 text-sm">No certifications listed.</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                        </div>
                    </ScrollArea>
                </SheetContent >
            </Sheet >

            {/* --- FORMS --- */}
            {
                resume && (
                    <>
                        <ExperienceFormDialog
                            open={activeForm === "experience"}
                            onOpenChange={(open) => !open && setActiveForm(null)}
                            resumeId={resume.resume_id}
                            initialData={activeForm === "experience" && editingItem ? editingItem as ResumeWorkExperienceResponse : undefined}
                            onSuccess={handleFormSuccess}
                        />
                        <EducationFormDialog
                            open={activeForm === "education"}
                            onOpenChange={(open) => !open && setActiveForm(null)}
                            resumeId={resume.resume_id}
                            initialData={activeForm === "education" && editingItem ? editingItem as ResumeEducationResponse : undefined}
                            onSuccess={handleFormSuccess}
                        />
                        <SkillsFormDialog
                            open={activeForm === "skills"}
                            onOpenChange={(open) => !open && setActiveForm(null)}
                            resumeId={resume.resume_id}
                            initialData={undefined}
                            onSuccess={handleFormSuccess}
                        />
                        <CertificationFormDialog
                            open={isCertificationOpen}
                            onOpenChange={(open) => !open && setIsCertificationOpen(false)}
                            resumeId={resume.resume_id}
                            initialData={editingCertification || undefined}
                            onSuccess={handleFormSuccess}
                        />

                        <BasicInfoFormDialog
                            open={isBasicInfoOpen}
                            onOpenChange={(open) => !open && setIsBasicInfoOpen(false)}
                            resumeId={resume.resume_id}
                            initialData={resume}
                            onSuccess={handleFormSuccess}
                        />
                    </>
                )
            }
        </>
    );
}
