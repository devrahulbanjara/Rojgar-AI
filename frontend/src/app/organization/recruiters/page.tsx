"use client";

import React, { useState } from "react";
import { Plus, Search, MoreVertical, Mail, CheckCircle2, XCircle, Pencil, Trash2 } from "lucide-react";
import { AppShell } from "../../../components/layout/AppShell";
import {
    PageTransition,
    AnimatedContainer,
} from "../../../components/common";
import { RecruiterModal, RecruiterFormData } from "../../../components/organization/RecruiterModal";
import { cn } from "../../../lib/utils";

interface Recruiter {
    id: string;
    name: string;
    email: string;
    status: string;
    activeJobs: number;
    joinedDate: string;
    avatar: string;
}

const initialRecruiters: Recruiter[] = [
    {
        id: "1",
        name: "Rahul Banjara",
        email: "rahul.banjara@techcorp.com",
        status: "Active",
        activeJobs: 8,
        joinedDate: "Jan 15, 2024",
        avatar: "https://ui-avatars.com/api/?name=Sarah+Wilson&background=random",
    },
    {
        id: "2",
        name: "Some recruiter",
        email: "some.recruiter@techcorp.com",
        status: "Active",
        activeJobs: 5,
        joinedDate: "Feb 03, 2024",
        avatar: "https://ui-avatars.com/api/?name=Michael+Chen&background=random",
    },
    {
        id: "3",
        name: "Some recruiter2",
        email: "some.recruiter2@techcorp.com",
        status: "Inactive",
        activeJobs: 0,
        joinedDate: "Mar 10, 2024",
        avatar: "https://ui-avatars.com/api/?name=Emily+Davis&background=random",
    },
    {
        id: "4",
        name: "Some recruiter3",
        email: "some.recruiter3@techcorp.com",
        status: "Active",
        activeJobs: 12,
        joinedDate: "Dec 12, 2023",
        avatar: "https://ui-avatars.com/api/?name=David+Miller&background=random",
    },
];

export default function RecruitersPage() {
    const [recruiters, setRecruiters] = useState<Recruiter[]>(initialRecruiters);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"add" | "edit">("add");
    const [selectedRecruiter, setSelectedRecruiter] = useState<Recruiter | null>(null);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    const filteredRecruiters = recruiters.filter((recruiter) =>
        recruiter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recruiter.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddRecruiter = () => {
        setModalMode("add");
        setSelectedRecruiter(null);
        setIsModalOpen(true);
    };

    const handleEditRecruiter = (recruiter: Recruiter) => {
        setModalMode("edit");
        setSelectedRecruiter(recruiter);
        setIsModalOpen(true);
        setActiveMenuId(null);
    };

    const handleDeleteRecruiter = (id: string) => {
        if (window.confirm("Are you sure you want to delete this recruiter?")) {
            setRecruiters(recruiters.filter((r) => r.id !== id));
        }
        setActiveMenuId(null);
    };

    const handleModalSubmit = (data: RecruiterFormData) => {
        if (modalMode === "add") {
            const newRecruiter: Recruiter = {
                id: Math.random().toString(36).substr(2, 9),
                name: data.name,
                email: data.email,
                status: "Active",
                activeJobs: 0,
                joinedDate: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`,
            };
            setRecruiters([...recruiters, newRecruiter]);
        } else {
            if (selectedRecruiter) {
                setRecruiters(recruiters.map((r) =>
                    r.id === selectedRecruiter.id ? { ...r, ...data } : r
                ));
            }
        }
        setIsModalOpen(false);
    };

    return (
        <AppShell>
            <PageTransition
                className="min-h-screen"
                style={{ background: "#F9FAFB" }}
            >
                <div className="space-y-8 pb-12">
                    <AnimatedContainer direction="up" delay={0.1}>
                        <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 py-12 bg-gradient-to-b from-indigo-50/50 to-white border-b border-indigo-50/50 mb-8">
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h1 className="text-4xl max-lg:text-3xl font-bold text-[#0F172A] leading-tight tracking-tight">
                                            Recruiters
                                        </h1>
                                        <p className="text-lg text-[#475569] mt-2 max-w-2xl">
                                            Manage your recruitment team and their access.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleAddRecruiter}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Add Recruiter
                                    </button>
                                </div>
                            </div>
                        </div>
                    </AnimatedContainer>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                        <AnimatedContainer direction="up" delay={0.2}>
                            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search recruiters by name or email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                            </div>
                        </AnimatedContainer>

                        <AnimatedContainer direction="up" delay={0.3}>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-slate-900">Recruiter Team</h2>
                                    <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                                        Total: {filteredRecruiters.length}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {filteredRecruiters.map((recruiter) => (
                                        <div
                                            key={recruiter.id}
                                            className="group relative bg-white rounded-[24px] border border-slate-200 p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] hover:border-indigo-200"
                                        >
                                            {/* Action Menu */}
                                            <div className="absolute top-6 right-6 z-10">
                                                <button
                                                    onClick={() => setActiveMenuId(activeMenuId === recruiter.id ? null : recruiter.id)}
                                                    className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100"
                                                >
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>

                                                {activeMenuId === recruiter.id && (
                                                    <>
                                                        <div
                                                            className="fixed inset-0 z-10"
                                                            onClick={() => setActiveMenuId(null)}
                                                        />
                                                        <div className="absolute right-0 mt-3 mr-1 w-52 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] border border-slate-100 z-20 py-1.5 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
                                                            <button
                                                                onClick={() => handleEditRecruiter(recruiter)}
                                                                className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-3 transition-colors group/item"
                                                            >
                                                                <Pencil className="w-3.5 h-3.5 text-slate-400 group-hover/item:text-indigo-500 transition-colors" />
                                                                <span className="font-medium">Edit Details</span>
                                                            </button>

                                                            <div className="h-px bg-slate-100/60 my-1 mx-2" />

                                                            <button
                                                                onClick={() => handleDeleteRecruiter(recruiter.id)}
                                                                className="w-full px-4 py-3 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-3 transition-colors group/item"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5 text-rose-500 group-hover/item:scale-110 transition-transform" />
                                                                <span className="font-medium">Delete Recruiter</span>
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {/* Card Content */}
                                            <div className="flex flex-col h-full">
                                                <div className="flex flex-col items-center text-center gap-4 mb-8">
                                                    <div className="relative">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={recruiter.avatar}
                                                            alt={recruiter.name}
                                                            className="w-20 h-20 rounded-[20px] border-4 border-white shadow-[0_8px_16px_-4px_rgba(0,0,0,0.1)] object-cover transition-transform duration-300 group-hover:scale-105"
                                                        />
                                                        <div className="absolute inset-0 rounded-[20px] ring-1 ring-slate-900/5 ring-inset" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-xl font-extrabold text-slate-900 truncate group-hover:text-indigo-600 transition-colors tracking-tight mb-1">
                                                            {recruiter.name}
                                                        </h3>
                                                        <div className="flex items-center justify-center gap-1.5 text-sm text-slate-500 font-medium">
                                                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                            {recruiter.email}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-auto pt-6 border-t border-slate-50">
                                                    <div className="flex items-center justify-center">
                                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-full">
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Joined {recruiter.joinedDate}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {filteredRecruiters.length === 0 && (
                                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Search className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <h3 className="text-lg font-medium text-slate-900">No recruiters found</h3>
                                        <p className="text-slate-500 mt-1">
                                            Try adjusting your search terms.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </AnimatedContainer>
                    </div>
                </div>
            </PageTransition>

            <RecruiterModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
                initialData={selectedRecruiter || undefined}
                mode={modalMode}
            />
        </AppShell>
    );
}
