"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  Building2,
  DollarSign,
  FileText,
  Loader2,
  RotateCcw,
  Briefcase,
  Pencil,
  X as XIcon,
} from "lucide-react";
import { cn } from "../../lib/utils";
import {
  useCreateJob,
  useGenerateJobDraft,
  useUpdateJob,
} from "../../hooks/queries/useJobs";
import { useReferenceJDs } from "../../hooks/queries/useReferenceJDs";
import { toast } from "sonner";
import type {
  CreateJobRequest,
  JobLevel,
  LocationType,
  EmploymentType,
  Job,
} from "../../types/job";

interface JobCreationWizardProps {
  mode: "agent" | "manual";
  onBack: () => void;
  onComplete: () => void;
  jobToEdit?: Job;
  initialReferenceJdId?: string;
}

const getSteps = () => {
  // Unified steps - same order for all modes
  return [
    { id: 1, title: "Basic Info", icon: Building2 },
    { id: 2, title: "Job Details", icon: FileText },
    { id: 3, title: "Requirements", icon: Briefcase },
    { id: 4, title: "Compensation", icon: DollarSign },
  ];
};

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={cn("h-4 bg-slate-100 rounded animate-pulse", className)}
      style={{
        background:
          "linear-gradient(90deg, #F1F5F9 25%, #F8FAFC 50%, #F1F5F9 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s ease-in-out infinite",
      }}
    />
  );
}

const revisionSuggestions = [
  "Change the salary in Nepali Rupees (NPR)",
  "Add more technical skills and technologies related to this field.",
  "Make the tone more professional and formal.",
  "Include a bit more details about our company.",
  "Expand the 'What We Offer' section with more benefits",
  "Make the job description more concise and focused",
  "Add more details about day-to-day responsibilities",
  "Include more information about growth opportunities",
  "Make the requirements less strict, more flexible",
];

export function JobCreationWizard({
  mode,
  onBack,
  onComplete,
  jobToEdit,
  initialReferenceJdId,
}: JobCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [showRevisionPrompt, setShowRevisionPrompt] = useState(false);
  const [revisionText, setRevisionText] = useState("");
  const [activeTab, setActiveTab] = useState<"agent" | "manual">("agent");
  const [editingField, setEditingField] = useState<{
    field: string;
    index: number;
  } | null>(null);
  const [editValue, setEditValue] = useState("");

  // Switch to agent tab if reference JD ID is provided
  useEffect(() => {
    if (initialReferenceJdId && activeTab !== "agent") {
      setActiveTab("agent");
    }
  }, [initialReferenceJdId]);

  // Reset step when editing
  useEffect(() => {
    if (jobToEdit) {
      setCurrentStep(1);
    }
  }, [jobToEdit]);

  const createJobMutation = useCreateJob();
  const updateJobMutation = useUpdateJob();
  const generateDraftMutation = useGenerateJobDraft();

  const steps = getSteps();

  const getContentStep = (step: number): number => {
    // Unified step mapping - same for all modes
    return step;
  };

  const handleSuggestionClick = (suggestion: string) => {
    setRevisionText(suggestion);
  };

  const [formData, setFormData] = useState({
    title: "",
    department: "",
    level: "",
    keywords: "",
    reference_jd_id: initialReferenceJdId || "",
    description: "",
    jobResponsibilities: [""],
    locationCity: "",
    locationCountry: "",
    locationType: "",
    employmentType: "",
    requiredSkillsAndExperience: [""],
    niceToHave: [""],
    salaryMin: "",
    salaryMax: "",
    currency: "NPR",
    benefits: [""],
    applicationDeadline: "",
  });

  // Update reference_jd_id when initialReferenceJdId changes
  useEffect(() => {
    if (initialReferenceJdId) {
      setFormData((prev) => ({
        ...prev,
        reference_jd_id: initialReferenceJdId,
      }));
    }
  }, [initialReferenceJdId]);

  // Fetch reference JDs for Agent Mode
  const { data: referenceJDsData, isLoading: isLoadingReferenceJDs } =
    useReferenceJDs();

  useEffect(() => {
    if (jobToEdit) {
      // Pre-populate keywords with existing requirements for AI revision
      const existingRequirements = jobToEdit.requirements && jobToEdit.requirements.length > 0
        ? jobToEdit.requirements.join(", ")
        : "";

      setFormData({
        title: jobToEdit.title || "",
        department: jobToEdit.department || "",
        level: jobToEdit.level || "",
        keywords: existingRequirements, // Pre-fill for AI revision
        reference_jd_id: "",
        description: jobToEdit.description || "",
        jobResponsibilities: (jobToEdit as any).job_responsibilities && (jobToEdit as any).job_responsibilities.length > 0
          ? (jobToEdit as any).job_responsibilities
          : [""],
        locationCity: jobToEdit.location_city || "",
        locationCountry: jobToEdit.location_country || "",
        locationType: jobToEdit.location_type || "",
        employmentType: jobToEdit.employment_type || "",
        requiredSkillsAndExperience:
          jobToEdit.requirements && jobToEdit.requirements.length > 0
            ? jobToEdit.requirements
            : [""],
        niceToHave:
          jobToEdit.nice_to_have && jobToEdit.nice_to_have.length > 0
            ? jobToEdit.nice_to_have
            : [""],
        salaryMin: jobToEdit.salary_min?.toString() || "",
        salaryMax: jobToEdit.salary_max?.toString() || "",
        currency: jobToEdit.salary_currency || "NPR",
        benefits:
          jobToEdit.benefits && jobToEdit.benefits.length > 0
            ? jobToEdit.benefits
            : [""],
        applicationDeadline: jobToEdit.application_deadline || "",
      });

      // If editing and mode is agent, mark as generated so revision button shows
      if (mode === "agent" && jobToEdit.description) {
        setIsGenerated(true);
      }
    }
  }, [jobToEdit, mode]);

  const handleGenerate = async () => {
    if (!formData.title || !formData.keywords || !formData.reference_jd_id) {
      toast.error("Missing information", {
        description:
          "Please provide a job title, requirements, and select a reference JD to generate a description.",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const result = await generateDraftMutation.mutateAsync({
        title: formData.title,
        raw_requirements: formData.keywords,
        reference_jd_id: formData.reference_jd_id,
      });

      setIsGenerating(false);
      setIsGenerated(true);

      // Map new backend fields to form fields (with fallback to legacy fields)
      const description = result.job_summary || result.description || "";
      const jobResponsibilities = result.job_responsibilities || [];
      const requiredSkills = result.required_qualifications || result.requiredSkillsAndExperience || [];
      const niceToHave = result.preferred || result.niceToHave || [];
      const benefits = result.compensation_and_benefits || result.benefits || [];

      setFormData((prev) => ({
        ...prev,
        title: result.title || prev.title,
        description: description,
        jobResponsibilities: jobResponsibilities.length > 0 ? jobResponsibilities : prev.jobResponsibilities,
        requiredSkillsAndExperience:
          requiredSkills.length > 0 ? requiredSkills : prev.requiredSkillsAndExperience,
        niceToHave: niceToHave.length > 0 ? niceToHave : prev.niceToHave,
        benefits: benefits.length > 0 ? benefits : prev.benefits,
      }));

      toast.success("Job description generated!", {
        description:
          "AI-generated content has been filled in. Review and edit as needed.",
        duration: 4000,
      });
    } catch (err) {
      setIsGenerating(false);
      const error = err as {
        data?: { detail?: string; message?: string };
        message?: string;
      };
      const errorMessage =
        error?.data?.detail ||
        error?.data?.message ||
        error?.message ||
        "Failed to generate job description.";
      toast.error("Generation failed", {
        description: errorMessage,
      });
    }
  };

  const handleRevision = async () => {
    if (!revisionText.trim()) return;

    setIsGenerating(true);
    setShowRevisionPrompt(false);

    try {
      // Build current draft state to preserve edits (using new backend field names)
      const currentDraft = {
        job_summary: formData.description || "",
        job_responsibilities: formData.jobResponsibilities.filter(
          (item) => item.trim() !== "",
        ),
        required_qualifications: formData.requiredSkillsAndExperience.filter(
          (item) => item.trim() !== "",
        ),
        preferred: formData.niceToHave.filter((item) => item.trim() !== ""),
        compensation_and_benefits: formData.benefits.filter((item) => item.trim() !== ""),
      };

      const result = await generateDraftMutation.mutateAsync({
        title: formData.title,
        raw_requirements: `${formData.keywords}\n\nRevision Request: ${revisionText}`,
        reference_jd_id: formData.reference_jd_id,
        current_draft: currentDraft,
      });

      // Map new backend fields to form fields (with fallback to legacy fields)
      const description = result.job_summary || result.description || prev.description;
      const jobResponsibilities = result.job_responsibilities || [];
      const requiredSkills = result.required_qualifications || result.requiredSkillsAndExperience || [];
      const niceToHave = result.preferred || result.niceToHave || [];
      const benefits = result.compensation_and_benefits || result.benefits || [];

      setFormData((prev) => ({
        ...prev,
        title: result.title || prev.title,
        description: description,
        jobResponsibilities: jobResponsibilities.length > 0 ? jobResponsibilities : prev.jobResponsibilities,
        requiredSkillsAndExperience:
          requiredSkills.length > 0 ? requiredSkills : prev.requiredSkillsAndExperience,
        niceToHave: niceToHave.length > 0 ? niceToHave : prev.niceToHave,
        benefits: benefits.length > 0 ? benefits : prev.benefits,
      }));

      setIsGenerating(false);
      setRevisionText("");

      toast.success("Job description revised!", {
        description: "The AI has updated the content based on your feedback.",
        duration: 4000,
      });
    } catch (err) {
      setIsGenerating(false);
      const error = err as {
        data?: { detail?: string; message?: string };
        message?: string;
      };
      const errorMessage =
        error?.data?.detail ||
        error?.data?.message ||
        error?.message ||
        "Failed to revise job description.";
      toast.error("Revision failed", {
        description: errorMessage,
      });
    }
  };

  const prepareJobData = (): CreateJobRequest => {
    const filteredRequiredSkills = formData.requiredSkillsAndExperience.filter(
      (item) => item.trim() !== "",
    );
    const filteredNiceToHave = formData.niceToHave.filter(
      (item) => item.trim() !== "",
    );
    const filteredBenefits = formData.benefits.filter(
      (item) => item.trim() !== "",
    );

    const salaryMin = formData.salaryMin
      ? parseInt(formData.salaryMin, 10)
      : undefined;
    const salaryMax = formData.salaryMax
      ? parseInt(formData.salaryMax, 10)
      : undefined;

    // Map form data to new backend field names (snake_case)
    const filteredJobResponsibilities = formData.jobResponsibilities.filter(
      (item) => item.trim() !== "",
    );

    return {
      title: formData.title.trim(),
      department: formData.department.trim() || "General",
      level: formData.level.trim() || "Mid",
      // New backend fields (required by JobDescription schema)
      job_summary: formData.description.trim() || "",
      job_responsibilities: filteredJobResponsibilities,
      required_qualifications:
        filteredRequiredSkills.length > 0 ? filteredRequiredSkills : [],
      preferred: filteredNiceToHave.length > 0 ? filteredNiceToHave : [],
      compensation_and_benefits: filteredBenefits.length > 0 ? filteredBenefits : [],
      // Backend expects snake_case for these fields
      location_city: formData.locationCity.trim() || undefined,
      location_country: formData.locationCountry.trim() || undefined,
      location_type: formData.locationType || "On-site",
      employment_type: formData.employmentType.trim() || "Full-time",
      salary_min: salaryMin,
      salary_max: salaryMax,
      salary_currency: formData.currency || "NPR",
      application_deadline: formData.applicationDeadline || undefined,
      mode: mode,
      status: "active",
      // Include raw_requirements if available (for agent mode)
      raw_requirements: formData.keywords.trim() || undefined,
    } as any; // Type assertion needed due to interface mismatch
  };

  const handleSaveDraft = async () => {
    if (!formData.title.trim()) {
      toast.error("Job title is required", {
        description: "Please enter a job title to save as draft.",
      });
      return;
    }

    const jobData = { ...prepareJobData(), status: "draft" as const };

    try {
      if (jobToEdit) {
        await updateJobMutation.mutateAsync({
          id: jobToEdit.job_id || jobToEdit.id.toString(),
          data: { ...jobData, id: jobToEdit.job_id || jobToEdit.id.toString(), status: "draft" },
        });
        toast.success("Draft updated successfully!", {
          description: `${formData.title} has been saved as a draft.`,
          duration: 4000,
        });
      } else {
        await createJobMutation.mutateAsync(jobData);
        toast.success("Draft saved successfully!", {
          description: `${formData.title} has been saved as a draft.`,
          duration: 4000,
        });
      }
      setTimeout(() => {
        onComplete();
      }, 500);
    } catch (err) {
      let errorMessage = jobToEdit
        ? "Failed to update draft. Please try again."
        : "Failed to save draft. Please try again.";
      const error = err as {
        data?: { detail?: string; message?: string };
        message?: string;
      };

      if (error) {
        if (error.data) {
          errorMessage =
            error.data.detail ||
            error.data.message ||
            error.message ||
            errorMessage;
        } else if (error.message) {
          errorMessage = error.message;
        }
      }

      toast.error(jobToEdit ? "Failed to update draft" : "Failed to save draft", {
        description: errorMessage,
        duration: 5000,
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Job title is required", {
        description: "Please enter a job title to continue.",
      });
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Job description is required", {
        description: "Please provide a description for this role.",
      });
      return;
    }
    const filteredRequiredSkills = formData.requiredSkillsAndExperience.filter(
      (item) => item.trim() !== "",
    );
    if (filteredRequiredSkills.length === 0) {
      toast.error("Required skills missing", {
        description: "Please add at least one required skill or experience.",
      });
      return;
    }

    const jobData = { ...prepareJobData(), status: "active" as const };

    try {
      if (jobToEdit) {
        await updateJobMutation.mutateAsync({
          id: jobToEdit.job_id || jobToEdit.id.toString(),
          data: { ...jobData, id: jobToEdit.job_id || jobToEdit.id.toString(), status: "active" },
        });
        toast.success("Job published successfully!", {
          description: `${formData.title} has been published and is now live.`,
          duration: 4000,
        });
      } else {
        await createJobMutation.mutateAsync(jobData);
        toast.success("Job created successfully!", {
          description: `${formData.title} has been published and is now live.`,
          duration: 4000,
        });
      }
      onComplete();
    } catch (err) {
      const error = err as {
        data?: { detail?: string; message?: string };
        message?: string;
      };
      const errorMessage =
        error?.data?.detail ||
        error?.data?.message ||
        error?.message ||
        (jobToEdit
          ? "Failed to publish job. Please try again."
          : "Failed to create job. Please try again.");
      toast.error(jobToEdit ? "Failed to publish job" : "Failed to create job", {
        description: errorMessage,
        duration: 5000,
      });
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const updateField = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateArrayField = (field: string, index: number, value: string) => {
    setFormData((prev) => {
      const arr = [...(prev[field as keyof typeof prev] as string[])];
      arr[index] = value;
      return { ...prev, [field]: arr };
    });
  };

  const addArrayItem = (field: string) => {
    setFormData((prev) => {
      const arr = [...(prev[field as keyof typeof prev] as string[]), ""];
      return { ...prev, [field]: arr };
    });
  };

  const removeArrayItem = (field: string, index: number) => {
    setFormData((prev) => {
      const arr = (prev[field as keyof typeof prev] as string[]).filter(
        (_, i) => i !== index,
      );
      return { ...prev, [field]: arr.length ? arr : [""] };
    });
    if (editingField?.field === field && editingField.index === index) {
      setEditingField(null);
    }
  };

  const startEditing = (field: string, index: number, currentValue: string) => {
    setEditingField({ field, index });
    setEditValue(currentValue);
  };

  const saveEdit = () => {
    if (editingField) {
      updateArrayField(editingField.field, editingField.index, editValue);
      setEditingField(null);
      setEditValue("");
    }
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  return (
    <div className="flex flex-col h-[70vh]">
      {/* Progress Steps - Fixed Header */}
      <div className="flex-shrink-0 px-8 py-5 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <React.Fragment key={step.id}>
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm",
                      isCompleted
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/20"
                        : isActive
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/30 scale-110"
                          : "bg-slate-100 text-slate-400",
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-sm font-semibold hidden sm:block transition-colors duration-200",
                      isActive
                        ? "text-indigo-600"
                        : isCompleted
                          ? "text-emerald-600"
                          : "text-slate-400",
                    )}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-1 mx-4 rounded-full transition-all duration-500",
                      currentStep > step.id
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                        : "bg-slate-100",
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Form Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {/* Step 1: Basic Info with Tabs for Agent/Manual Mode */}
        {currentStep === 1 && (
          <div className="space-y-8">
            {/* Tabs for Agent Mode and Manual Mode */}
            {!isGenerated && (
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab("agent")}
                    className={cn(
                      "flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 relative",
                      activeTab === "agent"
                        ? "text-indigo-700 border-b-[3px] border-indigo-600"
                        : "text-slate-600 hover:text-slate-900 border-b-[3px] border-transparent",
                    )}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <span>Agent Mode</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab("manual")}
                    className={cn(
                      "flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 relative",
                      activeTab === "manual"
                        ? "text-indigo-700 border-b-[3px] border-indigo-600"
                        : "text-slate-600 hover:text-slate-900 border-b-[3px] border-transparent",
                    )}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>Manual Mode</span>
                    </div>
                  </button>
                </div>

                {/* Agent Mode Content */}
                {activeTab === "agent" && (
                  <div className="px-8 py-6 space-y-6">
                    {/* Job Title */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Job Title <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => updateField("title", e.target.value)}
                        placeholder="e.g. Senior ML Engineer"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder:text-slate-400 transition-all text-base"
                      />
                    </div>

                    {/* Reference JD Selector */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Reference Job Description <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={formData.reference_jd_id}
                        onChange={(e) => updateField("reference_jd_id", e.target.value)}
                        className="w-full pl-4 pr-10 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-base text-slate-800 transition-colors duration-200 select-arrow bg-white"
                      >
                        <option value="">Select a reference JD...</option>
                        {isLoadingReferenceJDs ? (
                          <option disabled>Loading reference JDs...</option>
                        ) : referenceJDsData?.reference_jds && referenceJDsData.reference_jds.length > 0 ? (
                          referenceJDsData.reference_jds.map((refJD) => {
                            const jobSummary = refJD.job_summary || refJD.role_overview || "";
                            return (
                              <option key={refJD.id} value={refJD.id}>
                                {refJD.department
                                  ? `${refJD.department} - ${jobSummary.slice(0, 50)}...`
                                  : jobSummary.slice(0, 80)}
                              </option>
                            );
                          })
                        ) : (
                          <option disabled>No reference JDs available</option>
                        )}
                      </select>
                      <p className="text-xs text-slate-500 mt-2">
                        {referenceJDsData?.reference_jds && referenceJDsData.reference_jds.length > 0
                          ? "Select a reference JD to guide the AI in generating a similar job description."
                          : "Create reference JDs in your organization to use them as templates for AI generation."}
                      </p>
                    </div>

                    {/* Keywords */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Keywords & Requirements{" "}
                        <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        value={formData.keywords || ""}
                        onChange={(e) => updateField("keywords", e.target.value)}
                        placeholder={jobToEdit ? "Describe what you'd like to change or improve..." : "e.g. FastAPI, AWS, PyTorch, MLOps, 5 years experience..."}
                        rows={4}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder:text-slate-400 transition-all resize-none text-base"
                      />
                    </div>

                    {/* Generate Button */}
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating || generateDraftMutation.isPending || !formData.title.trim() || !formData.keywords.trim() || !formData.reference_jd_id}
                      className={cn(
                        "group relative w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg overflow-hidden",
                        !isGenerating && !generateDraftMutation.isPending && formData.title.trim() && formData.keywords.trim() && formData.reference_jd_id
                          ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-indigo-500/25 hover:from-indigo-700 hover:to-blue-700 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed",
                      )}
                    >
                      {!isGenerating && !generateDraftMutation.isPending && formData.title.trim() && formData.keywords.trim() && formData.reference_jd_id && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      )}
                      <div className="relative flex items-center gap-2">
                        {isGenerating || generateDraftMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" />
                            <span>{jobToEdit ? "Revise with AI" : "Generate with AI"}</span>
                          </>
                        )}
                      </div>
                    </button>
                  </div>
                )}

                {/* Manual Mode Content */}
                {activeTab === "manual" && (
                  <div className="px-8 py-6 space-y-6">
                    {/* Job Title */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Job Title <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => updateField("title", e.target.value)}
                        placeholder="e.g. Senior Software Engineer"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder:text-slate-400 transition-all text-base"
                      />
                    </div>

                    {/* Department and Level */}
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                          Department <span className="text-red-400">*</span>
                        </label>
                        <select
                          value={formData.department}
                          onChange={(e) => updateField("department", e.target.value)}
                          className="w-full pl-4 pr-10 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-base text-slate-800 transition-colors duration-200 select-arrow bg-white"
                        >
                          <option value="">Select department...</option>
                          <option value="Engineering">Engineering</option>
                          <option value="Design">Design</option>
                          <option value="Product">Product</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Sales">Sales</option>
                          <option value="Operations">Operations</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                          Level <span className="text-red-400">*</span>
                        </label>
                        <select
                          value={formData.level}
                          onChange={(e) => updateField("level", e.target.value)}
                          className="w-full pl-4 pr-10 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-base text-slate-800 transition-colors duration-200 select-arrow bg-white"
                        >
                          <option value="">Select level...</option>
                          <option value="Junior">Junior</option>
                          <option value="Mid">Mid-Level</option>
                          <option value="Senior">Senior</option>
                          <option value="Lead">Lead</option>
                          <option value="Principal">Principal</option>
                        </select>
                      </div>
                    </div>

                    {/* Job Summary */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Job Summary <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => updateField("description", e.target.value)}
                        rows={Math.max(4, Math.ceil(formData.description.length / 80))}
                        placeholder="Summarize what this role is about..."
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-y text-base leading-relaxed text-slate-800 placeholder:text-slate-400 min-h-[100px] max-h-[300px] overflow-y-auto"
                      />
                    </div>

                    {/* Job Responsibilities */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Job Responsibilities
                      </label>
                      <p className="text-sm text-slate-500 mb-3">
                        Add key responsibilities and duties for this role.
                      </p>
                      <div className="space-y-4">
                        {formData.jobResponsibilities.map((item, index) => {
                          const isEditing =
                            editingField?.field === "jobResponsibilities" &&
                            editingField.index === index;
                          return (
                            <div key={index} className="relative">
                              {isEditing ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    placeholder="e.g. Design and implement scalable backend services"
                                    rows={Math.max(2, Math.ceil(editValue.length / 60))}
                                    className="w-full px-4 pr-14 py-3 border-2 border-indigo-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-base leading-relaxed text-slate-800 placeholder:text-slate-400 transition-colors duration-200 resize-y min-h-[60px] max-h-[200px] overflow-y-auto whitespace-pre-wrap break-words"
                                    autoFocus
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      type="button"
                                      onClick={cancelEdit}
                                      className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={saveEdit}
                                      className="px-3 py-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="relative">
                                  <textarea
                                    value={item}
                                    onChange={(e) =>
                                      updateArrayField("jobResponsibilities", index, e.target.value)
                                    }
                                    placeholder="e.g. Design and implement scalable backend services"
                                    rows={Math.max(2, Math.ceil(item.length / 60))}
                                    className={cn(
                                      "w-full px-4 pr-14 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
                                      "text-base leading-relaxed text-slate-800 placeholder:text-slate-400",
                                      "transition-colors duration-200 resize-y min-h-[60px] max-h-[200px] overflow-y-auto",
                                      "whitespace-pre-wrap break-words",
                                      isGenerated && item && "bg-indigo-50/50 border-indigo-200",
                                    )}
                                  />
                                  <div className="absolute right-0 top-1/2 -translate-y-1/2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        startEditing("jobResponsibilities", index, item)
                                      }
                                      className="absolute p-1.5 text-slate-400 hover:text-indigo-600 transition-colors rounded hover:bg-indigo-50"
                                      style={{ right: "40px", top: "50%", transform: "translateY(-50%)" }}
                                      aria-label="Edit responsibility"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    {formData.jobResponsibilities.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeArrayItem("jobResponsibilities", index)
                                        }
                                        className="absolute p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-red-50"
                                        style={{ right: "12px", top: "50%", transform: "translateY(-50%)" }}
                                        aria-label="Remove responsibility"
                                      >
                                        <XIcon className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => addArrayItem("jobResponsibilities")}
                          className="text-sm text-indigo-500 font-medium hover:underline cursor-pointer"
                        >
                          + Add responsibility
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Loading Skeleton */}
        {isGenerating && (
          <div className="space-y-4 animate-pulse">
            <div className="bg-white rounded-lg p-5 border border-slate-200">
              <SkeletonLine className="w-28 h-4 mb-3" />
              <SkeletonLine className="w-full h-9 mb-2" />
              <SkeletonLine className="w-3/4 h-9" />
            </div>
            <div className="bg-white rounded-lg p-5 border border-slate-200">
              <SkeletonLine className="w-36 h-4 mb-3" />
              <SkeletonLine className="w-full h-20" />
            </div>
            <div className="bg-white rounded-lg p-5 border border-slate-200">
              <SkeletonLine className="w-32 h-4 mb-3" />
              <div className="flex gap-2">
                <SkeletonLine className="w-20 h-7 rounded-full" />
                <SkeletonLine className="w-24 h-7 rounded-full" />
                <SkeletonLine className="w-16 h-7 rounded-full" />
              </div>
            </div>
            <p className="text-center text-indigo-500 text-sm font-medium">
              AI is generating your job posting...
            </p>
          </div>
        )}

        {/* Form Steps */}
        {!isGenerating && (
          <>
            {/* Step 1: Basic Info - Show form only if content is generated (for editing) */}
            {currentStep === 1 && isGenerated && (
              <div className="space-y-8">
                {/* AI Generated Indicator */}
                {isGenerated && (
                  <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl px-8 py-6 flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-500 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm border border-indigo-100">
                      <Sparkles className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-indigo-900 mb-2">
                        AI Magic Applied!
                      </h4>
                      <p className="text-sm text-indigo-700 leading-relaxed">
                        We&apos;ve generated a professional job description
                        based on your requirements. Review the highlighted
                        fields below and make any edits you need.
                      </p>
                    </div>
                  </div>
                )}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="px-8 py-6 border-b border-slate-100">
                    <h4 className="text-xl font-bold text-slate-900">
                      Basic Information
                    </h4>
                  </div>
                  <div className="px-8 py-6 space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Job Title *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => updateField("title", e.target.value)}
                        placeholder="e.g. Senior Software Engineer"
                        className={cn(
                          "w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
                          "text-base text-slate-800 placeholder:text-slate-400",
                          "transition-colors duration-200",
                          isGenerated &&
                          formData.title &&
                          "bg-indigo-50/50 border-indigo-200",
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                          Department *
                        </label>
                        <select
                          value={formData.department}
                          onChange={(e) =>
                            updateField("department", e.target.value)
                          }
                          className={cn(
                            "w-full pl-4 pr-10 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
                            "text-base text-slate-800 transition-colors duration-200",
                            "select-arrow bg-white",
                            isGenerated &&
                            formData.department &&
                            "!bg-indigo-50/50 border-indigo-200",
                          )}
                        >
                          <option value="">Select department...</option>
                          <option value="Engineering">Engineering</option>
                          <option value="Design">Design</option>
                          <option value="Product">Product</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Sales">Sales</option>
                          <option value="Operations">Operations</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                          Level *
                        </label>
                        <select
                          value={formData.level}
                          onChange={(e) => updateField("level", e.target.value)}
                          className={cn(
                            "w-full pl-4 pr-10 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
                            "text-base text-slate-800 transition-colors duration-200",
                            "select-arrow bg-white",
                            isGenerated &&
                            formData.level &&
                            "!bg-indigo-50/50 border-indigo-200",
                          )}
                        >
                          <option value="">Select level...</option>
                          <option value="Junior">Junior</option>
                          <option value="Mid">Mid-Level</option>
                          <option value="Senior">Senior</option>
                          <option value="Lead">Lead</option>
                          <option value="Principal">Principal</option>
                        </select>
                      </div>
                    </div>

                    {/* Job Summary */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Job Summary *
                      </label>
                      <p className="text-sm text-slate-500 mb-3">
                        Brief 2-3 sentence summary about this position.
                      </p>
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          updateField("description", e.target.value)
                        }
                        rows={Math.max(
                          4,
                          Math.ceil(formData.description.length / 80),
                        )}
                        placeholder="Summarize what this role is about..."
                        className={cn(
                          "w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-y",
                          "text-base leading-relaxed text-slate-800 placeholder:text-slate-400",
                          "min-h-[100px] max-h-[300px] overflow-y-auto",
                          isGenerated &&
                          formData.description &&
                          "bg-indigo-50/50 border-indigo-200",
                        )}
                      />
                    </div>

                    {/* Job Responsibilities */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Job Responsibilities
                      </label>
                      <p className="text-sm text-slate-500 mb-3">
                        Add key responsibilities and duties for this role.
                      </p>
                      <div className="space-y-4">
                        {formData.jobResponsibilities.map((item, index) => {
                          const isEditing =
                            editingField?.field === "jobResponsibilities" &&
                            editingField.index === index;
                          return (
                            <div key={index} className="relative">
                              {isEditing ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    placeholder="e.g. Design and implement scalable backend services"
                                    rows={Math.max(2, Math.ceil(editValue.length / 60))}
                                    className="w-full px-4 pr-14 py-3 border-2 border-indigo-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-base leading-relaxed text-slate-800 placeholder:text-slate-400 transition-colors duration-200 resize-y min-h-[60px] max-h-[200px] overflow-y-auto whitespace-pre-wrap break-words"
                                    autoFocus
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      type="button"
                                      onClick={cancelEdit}
                                      className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={saveEdit}
                                      className="px-3 py-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="relative">
                                  <textarea
                                    value={item}
                                    onChange={(e) =>
                                      updateArrayField("jobResponsibilities", index, e.target.value)
                                    }
                                    placeholder="e.g. Design and implement scalable backend services"
                                    rows={Math.max(2, Math.ceil(item.length / 60))}
                                    className={cn(
                                      "w-full px-4 pr-14 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
                                      "text-base leading-relaxed text-slate-800 placeholder:text-slate-400",
                                      "transition-colors duration-200 resize-y min-h-[60px] max-h-[200px] overflow-y-auto",
                                      "whitespace-pre-wrap break-words",
                                      isGenerated && item && "bg-indigo-50/50 border-indigo-200",
                                    )}
                                  />
                                  <div className="absolute right-0 top-1/2 -translate-y-1/2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        startEditing("jobResponsibilities", index, item)
                                      }
                                      className="absolute p-1.5 text-slate-400 hover:text-indigo-600 transition-colors rounded hover:bg-indigo-50"
                                      style={{ right: "40px", top: "50%", transform: "translateY(-50%)" }}
                                      aria-label="Edit responsibility"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    {formData.jobResponsibilities.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeArrayItem("jobResponsibilities", index)
                                        }
                                        className="absolute p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-red-50"
                                        style={{ right: "12px", top: "50%", transform: "translateY(-50%)" }}
                                        aria-label="Remove responsibility"
                                      >
                                        <XIcon className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => addArrayItem("jobResponsibilities")}
                          className="text-sm text-indigo-500 font-medium hover:underline cursor-pointer"
                        >
                          + Add responsibility
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Job Details */}
            {getContentStep(currentStep) === 2 && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="px-8 py-6 border-b border-slate-100">
                    <h4 className="text-xl font-bold text-slate-900">
                      Job Details
                    </h4>
                  </div>
                  <div className="px-8 py-6 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                          City *
                        </label>
                        <input
                          type="text"
                          value={formData.locationCity}
                          onChange={(e) =>
                            updateField("locationCity", e.target.value)
                          }
                          placeholder="e.g. "
                          className={cn(
                            "w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
                            "text-base text-slate-800 placeholder:text-slate-400 transition-colors duration-200",
                            isGenerated &&
                            formData.locationCity &&
                            "bg-indigo-50/50 border-indigo-200",
                          )}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                          Country *
                        </label>
                        <input
                          type="text"
                          value={formData.locationCountry}
                          onChange={(e) =>
                            updateField("locationCountry", e.target.value)
                          }
                          placeholder="e.g. Nepal"
                          className={cn(
                            "w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
                            "text-base text-slate-800 placeholder:text-slate-400 transition-colors duration-200",
                            isGenerated &&
                            formData.locationCountry &&
                            "bg-indigo-50/50 border-indigo-200",
                          )}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Location Type *
                      </label>
                      <select
                        value={formData.locationType}
                        onChange={(e) =>
                          updateField("locationType", e.target.value)
                        }
                        className={cn(
                          "w-full pl-4 pr-10 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
                          "text-base text-slate-800 transition-colors duration-200",
                          "appearance-none bg-white bg-[length:16px_16px] bg-[right_12px_center] bg-no-repeat",
                          "select-arrow bg-white",
                          isGenerated &&
                          formData.locationType &&
                          "!bg-indigo-50/50 border-indigo-200",
                        )}
                      >
                        <option value="">Select type...</option>
                        <option value="Remote">Remote</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="On-site">On-site</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Employment Type *
                      </label>
                      <select
                        value={formData.employmentType}
                        onChange={(e) =>
                          updateField("employmentType", e.target.value)
                        }
                        className={cn(
                          "w-full pl-4 pr-10 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
                          "text-base text-slate-800 transition-colors duration-200",
                          "appearance-none bg-white bg-[length:16px_16px] bg-[right_12px_center] bg-no-repeat",
                          "select-arrow bg-white",
                          isGenerated &&
                          formData.employmentType &&
                          "!bg-indigo-50/50 border-indigo-200",
                        )}
                      >
                        <option value="">Select type...</option>
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Internship">Internship</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Requirements and Skills */}
            {getContentStep(currentStep) === 3 && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="px-8 py-6 border-b border-slate-100">
                    <h4 className="text-xl font-bold text-slate-900">
                      Required Qualifications
                    </h4>
                    <p className="text-sm text-slate-500 mt-2">
                      Add requirements, skills, and education  here.
                    </p>
                  </div>
                  <div className="px-8 py-6 space-y-4">
                    {formData.requiredSkillsAndExperience.map((item, index) => {
                      const isEditing =
                        editingField?.field === "requiredSkillsAndExperience" &&
                        editingField.index === index;
                      return (
                        <div key={index} className="relative">
                          {isEditing ? (
                            <div className="space-y-2">
                              <textarea
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                placeholder="e.g. Strong experience with Python for backend development"
                                rows={Math.max(2, Math.ceil(editValue.length / 60))}
                                className={cn(
                                  "w-full px-4 pr-14 py-3 border-2 border-indigo-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20",
                                  "text-base leading-relaxed text-slate-800 placeholder:text-slate-400",
                                  "transition-colors duration-200 resize-y min-h-[60px] max-h-[200px] overflow-y-auto",
                                  "whitespace-pre-wrap break-words",
                                )}
                                autoFocus
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={saveEdit}
                                  className="px-3 py-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="relative">
                              <textarea
                                value={item}
                                onChange={(e) =>
                                  updateArrayField(
                                    "requiredSkillsAndExperience",
                                    index,
                                    e.target.value,
                                  )
                                }
                                placeholder="e.g. Strong experience with Python for backend development"
                                rows={Math.max(2, Math.ceil(item.length / 60))}
                                className={cn(
                                  "w-full px-4 pr-14 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
                                  "text-base leading-relaxed text-slate-800 placeholder:text-slate-400",
                                  "transition-colors duration-200 resize-y min-h-[60px] max-h-[200px] overflow-y-auto",
                                  "whitespace-pre-wrap break-words",
                                  isGenerated &&
                                  item &&
                                  "bg-indigo-50/50 border-indigo-200",
                                )}
                              />
                              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    startEditing("requiredSkillsAndExperience", index, item)
                                  }
                                  className="absolute p-1.5 text-slate-400 hover:text-indigo-600 transition-colors rounded hover:bg-indigo-50"
                                  style={{ right: "40px", top: "50%", transform: "translateY(-50%)" }}
                                  aria-label="Edit requirement"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                {formData.requiredSkillsAndExperience.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeArrayItem(
                                        "requiredSkillsAndExperience",
                                        index,
                                      )
                                    }
                                    className="absolute p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-red-50"
                                    style={{ right: "12px", top: "50%", transform: "translateY(-50%)" }}
                                    aria-label="Remove requirement"
                                  >
                                    <XIcon className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <button
                      onClick={() =>
                        addArrayItem("requiredSkillsAndExperience")
                      }
                      className="text-sm text-indigo-500 font-medium hover:underline cursor-pointer"
                    >
                      + Add requirements
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="px-8 py-6 border-b border-slate-100">
                    <h4 className="text-xl font-bold text-slate-900">
                      Preferred
                    </h4>
                    <p className="text-sm text-slate-500 mt-2">
                      Optional experiences, qualities that would be beneficial but not
                      strictly required for this role.
                    </p>
                  </div>
                  <div className="px-8 py-6 space-y-4">
                    {formData.niceToHave.map((item, index) => {
                      const isEditing =
                        editingField?.field === "niceToHave" &&
                        editingField.index === index;
                      return (
                        <div key={index} className="relative">
                          {isEditing ? (
                            <div className="space-y-2">
                              <textarea
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                placeholder="e.g. Experience with Kubernetes and container orchestration"
                                rows={Math.max(2, Math.ceil(editValue.length / 60))}
                                className={cn(
                                  "w-full px-4 pr-14 py-3 border-2 border-indigo-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20",
                                  "text-base leading-relaxed text-slate-800 placeholder:text-slate-400",
                                  "transition-colors duration-200 resize-y min-h-[60px] max-h-[200px] overflow-y-auto",
                                  "whitespace-pre-wrap break-words",
                                )}
                                autoFocus
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={saveEdit}
                                  className="px-3 py-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="relative">
                              <textarea
                                value={item}
                                onChange={(e) =>
                                  updateArrayField("niceToHave", index, e.target.value)
                                }
                                placeholder="e.g. Experience with Kubernetes and container orchestration"
                                rows={Math.max(2, Math.ceil(item.length / 60))}
                                className={cn(
                                  "w-full px-4 pr-14 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
                                  "text-base leading-relaxed text-slate-800 placeholder:text-slate-400",
                                  "transition-colors duration-200 resize-y min-h-[60px] max-h-[200px] overflow-y-auto",
                                  "whitespace-pre-wrap break-words",
                                  isGenerated &&
                                  item &&
                                  "bg-indigo-50/50 border-indigo-200",
                                )}
                              />
                              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                                <button
                                  type="button"
                                  onClick={() => startEditing("niceToHave", index, item)}
                                  className="absolute p-1.5 text-slate-400 hover:text-indigo-600 transition-colors rounded hover:bg-indigo-50"
                                  style={{ right: "40px", top: "50%", transform: "translateY(-50%)" }}
                                  aria-label="Edit nice to have"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                {formData.niceToHave.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeArrayItem("niceToHave", index)}
                                    className="absolute p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-red-50"
                                    style={{ right: "12px", top: "50%", transform: "translateY(-50%)" }}
                                    aria-label="Remove nice to have"
                                  >
                                    <XIcon className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <button
                      onClick={() => addArrayItem("niceToHave")}
                      className="text-sm text-indigo-500 font-medium hover:underline cursor-pointer"
                    >
                      + Add nice to have
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Compensation */}
            {getContentStep(currentStep) === 4 && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="px-8 py-6 border-b border-slate-100">
                    <h4 className="text-xl font-bold text-slate-900">
                      Compensation
                    </h4>
                  </div>
                  <div className="px-8 py-6 space-y-6">
                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                          Min Salary
                        </label>
                        <input
                          type="number"
                          value={formData.salaryMin}
                          onChange={(e) =>
                            updateField("salaryMin", e.target.value)
                          }
                          placeholder="80000"
                          className={cn(
                            "w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
                            "text-base text-slate-800 placeholder:text-slate-400 transition-colors duration-200",
                          )}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                          Max Salary
                        </label>
                        <input
                          type="number"
                          value={formData.salaryMax}
                          onChange={(e) =>
                            updateField("salaryMax", e.target.value)
                          }
                          placeholder="120000"
                          className={cn(
                            "w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
                            "text-base text-slate-800 placeholder:text-slate-400 transition-colors duration-200",
                          )}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                          Currency
                        </label>
                        <select
                          value={formData.currency}
                          onChange={(e) =>
                            updateField("currency", e.target.value)
                          }
                          className="w-full pl-4 pr-10 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 select-arrow bg-white text-base text-slate-800 transition-colors duration-200"
                        >
                          <option value="INR">INR</option>
                          <option value="USD">USD</option>
                          <option value="NPR">NPR</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Application Deadline
                      </label>
                      <input
                        type="date"
                        value={formData.applicationDeadline}
                        onChange={(e) =>
                          updateField("applicationDeadline", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-base text-slate-800 transition-colors duration-200"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="px-8 py-6 border-b border-slate-100">
                    <h4 className="text-xl font-bold text-slate-900">
                      Compensation & Benefits
                    </h4>
                  </div>
                  <div className="px-8 py-6 space-y-4">
                    {formData.benefits.map((benefit, index) => {
                      const isEditing =
                        editingField?.field === "benefits" &&
                        editingField.index === index;
                      return (
                        <div key={index} className="relative">
                          {isEditing ? (
                            <div className="space-y-2">
                              <textarea
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                placeholder="Add what we offer..."
                                rows={Math.max(2, Math.ceil(editValue.length / 60))}
                                className={cn(
                                  "w-full px-4 pr-14 py-3 border-2 border-indigo-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20",
                                  "text-base leading-relaxed text-slate-800 placeholder:text-slate-400",
                                  "transition-colors duration-200 resize-y min-h-[60px] max-h-[200px] overflow-y-auto",
                                  "whitespace-pre-wrap break-words",
                                )}
                                autoFocus
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={saveEdit}
                                  className="px-3 py-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="relative">
                              <textarea
                                value={benefit}
                                onChange={(e) =>
                                  updateArrayField("benefits", index, e.target.value)
                                }
                                placeholder="Add what we offer..."
                                rows={Math.max(2, Math.ceil(benefit.length / 60))}
                                className={cn(
                                  "w-full px-4 pr-14 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
                                  "text-base leading-relaxed text-slate-800 placeholder:text-slate-400",
                                  "transition-colors duration-200 resize-y min-h-[60px] max-h-[200px] overflow-y-auto",
                                  "whitespace-pre-wrap break-words",
                                  isGenerated &&
                                  benefit &&
                                  "bg-indigo-50/50 border-indigo-200",
                                )}
                              />
                              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                                <button
                                  type="button"
                                  onClick={() => startEditing("benefits", index, benefit)}
                                  className="absolute p-1.5 text-slate-400 hover:text-indigo-600 transition-colors rounded hover:bg-indigo-50"
                                  style={{ right: "40px", top: "50%", transform: "translateY(-50%)" }}
                                  aria-label="Edit benefit"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                {formData.benefits.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeArrayItem("benefits", index)}
                                    className="absolute p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-red-50"
                                    style={{ right: "12px", top: "50%", transform: "translateY(-50%)" }}
                                    aria-label="Remove benefit"
                                  >
                                    <XIcon className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <button
                      onClick={() => addArrayItem("benefits")}
                      className="text-sm text-indigo-500 font-medium hover:underline cursor-pointer"
                    >
                      + Add offering
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Actions - Fixed */}
      {!isGenerating && (
        <div className="flex-shrink-0 flex items-center justify-between px-8 py-5 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
          <button
            onClick={handlePrev}
            className="flex items-center gap-2 px-5 py-2.5 text-slate-600 text-sm font-semibold hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            {currentStep === 1 ? "Cancel" : "Back"}
          </button>

          <div className="flex items-center gap-3">
            {/* Save Draft / Publish */}
            {currentStep === steps.length ? (
              <div className="flex gap-3">
                {/* Revision Button - Show when editing a draft job or when AI content exists */}
                {(jobToEdit || isGenerated) && (
                  <button
                    onClick={() => setShowRevisionPrompt(true)}
                    className="flex items-center gap-2 px-5 py-2.5 text-indigo-600 text-sm font-semibold hover:bg-indigo-50 rounded-xl transition-all duration-200 border border-transparent hover:border-indigo-100"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Revise with AI
                  </button>
                )}
                <button
                  onClick={handleSaveDraft}
                  className={cn(
                    "px-5 py-2.5 text-slate-600 text-sm font-semibold rounded-xl transition-all duration-200 border border-slate-200",
                    createJobMutation.isPending || updateJobMutation.isPending
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900",
                  )}
                  disabled={createJobMutation.isPending || updateJobMutation.isPending}
                >
                  {createJobMutation.isPending || updateJobMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    jobToEdit ? "Save as Draft" : "Save Draft"
                  )}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={createJobMutation.isPending || updateJobMutation.isPending}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-bold rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/25",
                    createJobMutation.isPending || updateJobMutation.isPending
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:from-indigo-700 hover:to-blue-700 hover:shadow-indigo-500/40 hover:-translate-y-0.5",
                  )}
                >
                  {createJobMutation.isPending || updateJobMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      {jobToEdit && jobToEdit.status === "Draft" ? "Publish Job" : jobToEdit ? "Update & Publish" : "Publish Job"}
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                {/* Revision Button - Show when editing a draft job */}
                {jobToEdit && (
                  <button
                    onClick={() => setShowRevisionPrompt(true)}
                    className="flex items-center gap-2 px-5 py-2.5 text-indigo-600 text-sm font-semibold hover:bg-indigo-50 rounded-xl transition-all duration-200 border border-transparent hover:border-indigo-100"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Revise with AI
                  </button>
                )}
                {/* Save as Draft button - Available from Step 1 */}
                <button
                  onClick={handleSaveDraft}
                  className={cn(
                    "px-5 py-2.5 text-slate-600 text-sm font-semibold rounded-xl transition-all duration-200 border border-slate-200",
                    createJobMutation.isPending || updateJobMutation.isPending
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900",
                  )}
                  disabled={createJobMutation.isPending || updateJobMutation.isPending}
                >
                  {createJobMutation.isPending || updateJobMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    jobToEdit ? "Save as Draft" : "Save Draft"
                  )}
                </button>
                {/* Continue button */}
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-bold rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Revision Prompt Modal */}
      {showRevisionPrompt && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop with blur */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowRevisionPrompt(false)}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-lg border border-slate-200/50 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-white px-10 py-8 border-b border-slate-100">
              <h3 className="text-3xl font-bold text-slate-900 leading-tight tracking-tight">
                Request AI Revision
              </h3>
              <p className="text-slate-500 mt-2 font-medium text-lg">
                Tell the AI what you&apos;d like to change or improve
              </p>
            </div>

            {/* Body */}
            <div className="px-10 py-8 space-y-8">
              {/* Quick Suggestions */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-4">
                  Quick Suggestions
                </label>
                <div className="flex flex-wrap gap-3 max-h-32 overflow-y-auto pr-2">
                  {revisionSuggestions.slice(0, 4).map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={cn(
                        "px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                        "border border-slate-200 bg-white text-slate-700",
                        "hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700",
                        "cursor-pointer active:scale-95",
                      )}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Or Type Your Own Revision Instructions
                </label>
                <textarea
                  value={revisionText}
                  onChange={(e) => setRevisionText(e.target.value)}
                  placeholder="e.g., Make the requirements more specific, add more technical details, adjust the tone to be more formal..."
                  rows={5}
                  maxLength={500}
                  className={cn(
                    "w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
                    "text-base leading-relaxed text-slate-800 placeholder:text-slate-400",
                    "resize-y min-h-[120px] transition-colors duration-200",
                  )}
                />
                <div className="flex justify-between items-center mt-3">
                  <p className="text-sm text-slate-500">
                    Be specific about what you want changed
                  </p>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      revisionText.length > 450
                        ? "text-amber-600"
                        : "text-slate-400",
                    )}
                  >
                    {revisionText.length}/500
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-10 py-6 bg-white border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowRevisionPrompt(false)}
                className="px-5 py-2.5 text-slate-600 text-sm font-semibold hover:bg-slate-100 rounded-xl transition-all duration-200 border border-slate-200 hover:border-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleRevision}
                disabled={
                  !revisionText.trim() || generateDraftMutation.isPending
                }
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/25",
                  revisionText.trim() && !generateDraftMutation.isPending
                    ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed",
                )}
              >
                {generateDraftMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Revising...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Revise
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
