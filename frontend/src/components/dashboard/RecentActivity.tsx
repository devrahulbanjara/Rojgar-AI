import React from "react";
import {
  User,
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  Briefcase,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  date: string;
  type: "application" | "interview" | "offer" | "job_post" | "status_change";
}

const dummyActivities: ActivityItem[] = [
  {
    id: "1",
    user: "Rahul Dev Banjara",
    action: "applied for",
    target: "Senior Machine Learning Engineer",
    time: "17:55",
    date: "3 Jan",
    type: "application",
  },
  {
    id: "2",
    user: "Sampada Poudel",
    action: "scheduled her interview for",
    target: "Frontend Developer Role",
    time: "14:30",
    date: "3 Jan",
    type: "interview",
  },
  {
    id: "3",
    user: "System",
    action: "posted new job",
    target: "Backend Engineer (Go)",
    time: "09:15",
    date: "3 Jan",
    type: "job_post",
  },
  {
    id: "4",
    user: "Pratik Dhimal",
    action: "updated status to",
    target: "Technical Review",
    time: "16:45",
    date: "2 Jan",
    type: "status_change",
  },
  {
    id: "5",
    user: "Ajit Koirala",
    action: "accepted offer for",
    target: "Product Designer",
    time: "11:20",
    date: "2 Jan",
    type: "offer",
  },
];

const ActivityIcon = ({ type }: { type: ActivityItem["type"] }) => {
  switch (type) {
    case "application":
      return <FileText className="w-5 h-5 text-blue-600" />;
    case "interview":
      return <Calendar className="w-5 h-5 text-purple-600" />;
    case "offer":
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    case "job_post":
      return <Briefcase className="w-5 h-5 text-indigo-600" />;
    case "status_change":
      return <Clock className="w-5 h-5 text-amber-600" />;
    default:
      return <User className="w-5 h-5 text-gray-600" />;
  }
};

const ActivityColor = ({ type }: { type: ActivityItem["type"] }) => {
  switch (type) {
    case "application":
      return "bg-blue-50 border-blue-100";
    case "interview":
      return "bg-purple-50 border-purple-100";
    case "offer":
      return "bg-green-50 border-green-100";
    case "job_post":
      return "bg-indigo-50 border-indigo-100";
    case "status_change":
      return "bg-amber-50 border-amber-100";
    default:
      return "bg-gray-50 border-gray-100";
  }
};

export function RecentActivity() {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
      <div className="p-6 border-b border-[#E5E7EB] bg-gray-50/50">
        <h2 className="text-lg font-bold text-[#0F172A]">Recent Activity</h2>
        <p className="text-sm text-[#64748B]">
          Latest updates from your recruitment pipeline
        </p>
      </div>

      <div className="divide-y divide-gray-100">
        {dummyActivities.map((activity) => (
          <div
            key={activity.id}
            className="group p-4 hover:bg-gray-50 transition-colors duration-200 flex items-start gap-4"
          >
            {/* Date/Time Column */}
            <div className="flex-shrink-0 w-16 text-right pt-1">
              <div className="text-sm font-semibold text-[#0F172A]">
                {activity.date}
              </div>
              <div className="text-xs text-[#64748B]">{activity.time}</div>
            </div>

            {/* Icon Timeline */}
            <div className="relative flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm z-10 transition-transform duration-200 group-hover:scale-110",
                  ActivityColor({ type: activity.type }),
                )}
              >
                <ActivityIcon type={activity.type} />
              </div>
              {/* Vertical Line */}
              <div className="absolute top-10 bottom-[-24px] w-px bg-gray-200 group-last:hidden" />
            </div>

            {/* Content */}
            <div className="flex-1 pt-1">
              <p className="text-sm text-[#334155]">
                <span className="font-semibold text-[#0F172A]">
                  {activity.user}
                </span>{" "}
                <span className="text-[#64748B]">{activity.action}</span>{" "}
                <span className="font-medium text-[#3056F5]">
                  {activity.target}
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-gray-50/50 border-t border-[#E5E7EB] text-center">
        <button className="text-sm font-medium text-[#3056F5] hover:text-[#1E40AF] transition-colors">
          View All Activity
        </button>
      </div>
    </div>
  );
}
