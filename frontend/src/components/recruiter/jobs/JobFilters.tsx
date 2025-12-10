"use client";

import * as React from "react"
import { Search, X } from "lucide-react"
import { Input } from "../../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select"
import { Button } from "../../ui/button"
import { Badge } from "../../ui/badge"

export interface JobFiltersState {
    search: string
    status: string
    department: string
    level: string
    employmentType: string
    locationType: string
}

interface JobFiltersProps {
    filters: JobFiltersState
    onFilterChange: (filters: JobFiltersState) => void
}

export const JobFilters: React.FC<JobFiltersProps> = ({ filters, onFilterChange }) => {
    const handleChange = (key: keyof JobFiltersState, value: string) => {
        onFilterChange({ ...filters, [key]: value });
    };

    const clearFilters = () => {
        onFilterChange({
            search: "",
            status: "all",
            department: "all",
            level: "all",
            employmentType: "all",
            locationType: "all"
        });
    };

    const hasActiveFilters = Object.values(filters).some(val => val !== "all" && val !== "");

    const removeFilter = (key: keyof JobFiltersState) => {
        handleChange(key, key === 'search' ? '' : 'all');
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col space-y-4 rounded-lg border bg-card p-4 shadow-sm md:flex-row md:space-x-4 md:space-y-0">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by title, department, or skills..."
                        className="pl-9"
                        value={filters.search}
                        onChange={(e) => handleChange("search", e.target.value)}
                    />
                </div>
                <div className="flex flex-1 flex-wrap gap-2 md:flex-nowrap">
                    <Select value={filters.status} onValueChange={(val) => handleChange("status", val)}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filters.department} onValueChange={(val) => handleChange("department", val)}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Department" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Departments</SelectItem>
                            <SelectItem value="engineering">Engineering</SelectItem>
                            <SelectItem value="design">Design</SelectItem>
                            <SelectItem value="product">Product</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="sales">Sales</SelectItem>
                            <SelectItem value="hr">HR</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filters.level} onValueChange={(val) => handleChange("level", val)}>
                        <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Level" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Levels</SelectItem>
                            <SelectItem value="junior">Junior</SelectItem>
                            <SelectItem value="mid">Mid</SelectItem>
                            <SelectItem value="senior">Senior</SelectItem>
                            <SelectItem value="lead">Lead</SelectItem>
                            <SelectItem value="executive">Executive</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filters.employmentType} onValueChange={(val) => handleChange("employmentType", val)}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="full-time">Full-time</SelectItem>
                            <SelectItem value="part-time">Part-time</SelectItem>
                            <SelectItem value="contract">Contract</SelectItem>
                            <SelectItem value="internship">Internship</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filters.locationType} onValueChange={(val) => handleChange("locationType", val)}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Location" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Locations</SelectItem>
                            <SelectItem value="on-site">On-site</SelectItem>
                            <SelectItem value="remote">Remote</SelectItem>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                    </Select>

                    {hasActiveFilters && (
                        <Button variant="ghost" className="px-2" onClick={clearFilters}>
                            Clear
                        </Button>
                    )}
                </div>
            </div>

            {/* Active Filter Chips */}
            {hasActiveFilters && (
                <div className="flex flex-wrap gap-2">
                    {filters.search && (
                        <Badge variant="outline" className="gap-1 pl-2 pr-1">
                            Search: {filters.search}
                            <Button variant="ghost" size="sm" className="h-4 w-4 p-0 ml-1 hover:bg-transparent" onClick={() => removeFilter('search')}>
                                <X className="h-3 w-3" />
                                <span className="sr-only">Remove</span>
                            </Button>
                        </Badge>
                    )}
                    {Object.entries(filters).map(([key, value]) => {
                        if (key === 'search' || value === 'all' || value === '') return null;
                        return (
                            <Badge key={key} variant="outline" className="gap-1 pl-2 pr-1 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}: {value}
                                <Button variant="ghost" size="sm" className="h-4 w-4 p-0 ml-1 hover:bg-transparent" onClick={() => removeFilter(key as keyof JobFiltersState)}>
                                    <X className="h-3 w-3" />
                                    <span className="sr-only">Remove</span>
                                </Button>
                            </Badge>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
