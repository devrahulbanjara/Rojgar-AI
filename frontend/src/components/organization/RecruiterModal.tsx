"use client";

import React, { useEffect, useState } from "react";
import { User, Mail, Lock, Plus, Save } from "lucide-react";
import { cn } from "../../lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";

export interface RecruiterFormData {
    name: string;
    email: string;
    password?: string;
}

interface RecruiterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: RecruiterFormData) => void;
    initialData?: RecruiterFormData;
    mode: "add" | "edit";
}

export function RecruiterModal({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    mode,
}: RecruiterModalProps) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
    });

    useEffect(() => {
        if (isOpen && initialData && mode === "edit") {
            setFormData({
                name: initialData.name || "",
                email: initialData.email || "",
                password: "", // Don't populate password for security/UX
            });
        } else if (isOpen && mode === "add") {
            setFormData({
                name: "",
                email: "",
                password: "",
            });
        }
    }, [isOpen, initialData, mode]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
        onClose();
    };

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            className="max-w-md mx-4 rounded-[20px]"
        >
            <div className="flex flex-col bg-white rounded-[20px] overflow-hidden">
                {/* Enhanced Header with subtle background */}
                <DialogHeader className="bg-gradient-to-b from-gray-50/80 to-white px-8 py-8 border-b border-gray-100">
                    <DialogTitle className="text-2xl font-bold text-gray-900 leading-tight">
                        {mode === "add" ? "Add Recruiter" : "Edit Recruiter"}
                    </DialogTitle>
                    <DialogDescription className="text-gray-500 mt-2 text-sm font-medium">
                        {mode === "add"
                            ? "Enter details to add a new recruiter to your team."
                            : "Update recruiter information and access details."}
                    </DialogDescription>
                </DialogHeader>

                {/* Form Content */}
                <form onSubmit={handleSubmit}>
                    <DialogContent className="p-8 space-y-6 bg-white">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 ml-1">
                                Full Name
                            </label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 placeholder:text-gray-400"
                                    placeholder="e.g. Sarah Wilson"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 ml-1">
                                Email Address
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData({ ...formData, email: e.target.value })
                                    }
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 placeholder:text-gray-400"
                                    placeholder="e.g. sarah@company.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 ml-1">
                                Password
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                <input
                                    type="password"
                                    required={mode === "add"}
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData({ ...formData, password: e.target.value })
                                    }
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 placeholder:text-gray-400"
                                    placeholder={
                                        mode === "edit"
                                            ? "Leave blank to keep current"
                                            : "Enter password"
                                    }
                                />
                            </div>
                        </div>
                    </DialogContent>

                    {/* Sticky Footer */}
                    <DialogFooter className="border-t border-gray-100 bg-gray-50/50 px-8 py-6 flex items-center justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="h-11 px-6 text-sm font-semibold border-gray-200 hover:bg-white hover:border-gray-300 transition-all duration-200"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="h-11 px-6 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg flex items-center gap-2"
                        >
                            {mode === "add" ? (
                                <>
                                    <Plus className="w-4 h-4" />
                                    Add Recruiter
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </div>
        </Dialog>
    );
}
