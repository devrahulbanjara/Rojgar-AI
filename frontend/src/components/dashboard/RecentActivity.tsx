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
import { useRecentActivity, type ActivityItem } from "../../hooks/useRecentActivity";
import { LoadingSpinner } from "../common/LoadingSpinner";

// Format timestamp to display format
const formatTimestamp = (timestamp: string): { date: string; time: string } => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  let dateStr: string;
  if (diffInHours < 24) {
    dateStr = "Today";
  } else if (diffInHours < 48) {
    dateStr = "Yesterday";
  } else {
    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "short" });
    dateStr = `${day} ${month}`;
  }

  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return { date: dateStr, time: timeStr };
};

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
  const { data: activities = [], isLoading } = useRecentActivity();

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#E5E7EB] bg-gray-50/50">
          <h2 className="text-lg font-bold text-[#0F172A]">Recent Activity</h2>
          <p className="text-sm text-[#64748B]">
            Latest updates from your recruitment pipeline
          </p>
        </div>
        <div className="p-8 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
      <div className="p-6 border-b border-[#E5E7EB] bg-gray-50/50">
        <h2 className="text-lg font-bold text-[#0F172A]">Recent Activity</h2>
        <p className="text-sm text-[#64748B]">
          Latest updates from your recruitment pipeline
        </p>
      </div>

      {activities.length === 0 ? (
        <div className="p-8 text-center text-[#64748B]">
          <p>No recent activity</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {activities.map((activity, index) => {
            const { date, time } = formatTimestamp(activity.timestamp);
            return (
              <div
                key={activity.id}
                className="group p-4 hover:bg-gray-50 transition-colors duration-200 flex items-start gap-4"
              >
                {/* Date/Time Column */}
                <div className="flex-shrink-0 w-16 text-right pt-1">
                  <div className="text-sm font-semibold text-[#0F172A]">
                    {date}
                  </div>
                  <div className="text-xs text-[#64748B]">{time}</div>
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
                  {index < activities.length - 1 && (
                    <div className="absolute top-10 bottom-[-24px] w-px bg-gray-200" />
                  )}
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
            );
          })}
        </div>
      )}

      <div className="p-4 bg-gray-50/50 border-t border-[#E5E7EB] text-center">
        <button className="text-sm font-medium text-[#3056F5] hover:text-[#1E40AF] transition-colors">
          View All Activity
        </button>
      </div>
    </div>
  );
}
