export type UserRole = "ADMIN" | "EMPLOYEE";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  designation: string;
  department: string;
  avatar?: string | null;
  phone?: string | null;
}

export type ClientStatus = "ACTIVE" | "ON_HOLD" | "COMPLETED" | "DROPPED";
export type PriorityLevel = "LOW" | "MEDIUM" | "HIGH";

export type ApprovalStatus =
  | "DRAFT"
  | "SENT_TO_CLIENT"
  | "CHANGES_REQUESTED"
  | "APPROVED"
  | "SCHEDULED"
  | "PUBLISHED";

export type CalendarStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "APPROVED"
  | "COMPLETED";

export type LeaveType = "CASUAL" | "SICK" | "EMERGENCY" | "HALF_DAY" | "WFH";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";
export type AnnouncementPriority = "NORMAL" | "HIGH" | "URGENT";
