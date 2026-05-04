export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role?: Role;
  organization?: string;
  projects?: string[];
  status: "Active" | "Inactive" | "Suspended" | "Pending";
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  _id: string;
  name: string;
  organization: string;
  permissions: string[];
  description?: string;
  isSystemRole: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  _id: string;
  name: string;
  owner: string | User;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  status: "Initialized" | "Planning" | "Site Survey" | "In Progress" | "Under Snagging" | "Snagging Completed" | "Completed" | "On Hold" | "Cancelled";
  priority: "Low" | "Medium" | "High" | "Urgent";
  organization: string | Organization;
  createdBy: string | User;
  updatedBy?: string | User;
  members: (string | User)[];
  startDate?: string;
  endDate?: string;
  needSiteSurvey: boolean;
  siteSurveyor?: string | User;
  snaggedBy?: string | User;
  documents: ProjectDocument[];
  budgetHistory: BudgetHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDocument {
  url: string;
  name: string;
  mimeType: string;
  size: number;
  status: "Pending" | "Approved" | "Rejected";
  uploadedAt: string;
  uploadedBy: {
    user: string;
    name: string;
  };
}

export interface BudgetHistory {
  amount: number;
  reason: string;
  approvalStatus: "Pending" | "Approved" | "Rejected";
  updatedBy: string;
  updatedByName: string;
  timestamp: string;
}

export interface BOQItem {
  _id: string;
  project: string | Project;
  groupName: string;
  itemNumber?: string;
  itemDescription: string;
  unit?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  remark?: string;
  version: number;
  isLatest: boolean;
  historyId?: string;
  createdBy?: string | User;
  createdByName?: string;
  status: "Draft" | "Pending" | "Approved" | "Rejected";
  approvedBy?: string | User;
  approvedByName?: string;
  approvedAt?: string;
  requestedApprover?: string | User;
  requestedApproverName?: string;
  createdAt: string;
}
