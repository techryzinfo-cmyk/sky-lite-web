export interface User {
  id: string;
  _id?: string;
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

export interface Material {
  _id: string;
  name: string;
  unit: string;
  project: string | Project;
  organization: string | Organization;
  totalReceived: number;
  totalConsumed: number;
  balance: number;
  logs: MaterialLog[];
  createdAt: string;
  updatedAt: string;
}

export interface MaterialLog {
  type: "Request" | "Received" | "Used" | "Purchase" | "In" | "Out";
  quantity: number;
  date: string;
  note?: string;
  updatedBy?: string | User;
  updatedByName?: string;
}

export interface MaterialRequest {
  _id: string;
  project: string | Project;
  organization: string | Organization;
  requestedBy: string | User;
  requestedByName: string;
  items: MaterialRequestItem[];
  commonNote?: string;
  status: "Pending" | "Approved" | "Rejected" | "Partially Approved";
  approvedBy?: string | User;
  approvedByName?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialRequestItem {
  materialName: string;
  quantity: number;
  unit: string;
  note?: string;
  approvedQty?: number;
  status?: "Pending" | "Approved" | "Rejected";
}

export interface MaterialPurchase {
  _id: string;
  project: string | Project;
  organization: string | Organization;
  vendorName: string;
  poNumber?: string;
  items: PurchaseItem[];
  grandTotal: number;
  advancePaid?: number;
  paymentStatus: "Unpaid" | "Partial" | "Paid";
  commonNote?: string;
  createdBy: string | User;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseItem {
  materialName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface MaterialReceipt {
  _id: string;
  project: string | Project;
  organization: string | Organization;
  purchase?: string | MaterialPurchase;
  challanNumber?: string;
  invoiceNumber?: string;
  items: ReceiptItem[];
  receivedBy: string | User;
  receivedByName: string;
  status: "Pending" | "Verified" | "Rejected";
  verifiedBy?: string | User;
  verifiedByName?: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface ReceiptItem {
  materialName: string;
  expectedQty: number;
  receivedQty: number;
  unit: string;
}

export interface MaterialUsage {
  _id: string;
  project: string | Project;
  organization: string | Organization;
  items: UsageItem[];
  location?: string;
  task?: string;
  usedBy: string | User;
  usedByName: string;
  status: "Pending" | "Verified" | "Rejected";
  verifiedBy?: string | User;
  createdAt: string;
}

export interface UsageItem {
  materialName: string;
  quantity: number;
  unit: string;
}

export interface Issue {
  _id: string;
  title: string;
  description: string;
  status: "Draft" | "Open" | "In Progress" | "Resolved" | "Escalated" | "Closed";
  priority: "Low" | "Medium" | "High" | "Critical";
  category: "Technical" | "Resource" | "Financial" | "Site" | "Client" | "Third Party" | "Other";
  project: string | Project;
  organization: string | Organization;
  createdBy: string | User;
  assignedTo?: string | User;
  escalationLevel: number;
  resolutionDate?: string;
  resolutionDetails?: string;
  resolutionImage?: string;
  images: string[];
  history: IssueHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface IssueHistory {
  updatedBy: string | User;
  action: string;
  details: string;
  timestamp: string;
}

export interface Snag {
  _id: string;
  title: string;
  description: string;
  status: "Draft" | "Open" | "In Progress" | "Resolved" | "Closed";
  priority: "Low" | "Medium" | "High" | "Critical";
  project: string | Project;
  organization: string | Organization;
  createdBy: string | User;
  assignedTo?: string | User;
  resolutionDate?: string;
  resolutionDetails?: string;
  resolutionImage?: string;
  images: string[];
  history: IssueHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface Risk {
  _id: string;
  project: string | Project;
  organization: string | Organization;
  title: string;
  category: "Logistics" | "Resources" | "Environmental" | "Legal" | "Safety" | "Financial" | "Technical";
  description?: string;
  impact: "Low" | "Medium" | "High" | "Very High";
  probability: "Low" | "Medium" | "High";
  status: "Critical" | "Active" | "Monitored" | "Resolved";
  mitigationProgress: number;
  owner?: string | User;
  history: RiskHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface RiskHistory {
  updatedBy: string | User;
  note: string;
  oldStatus: string;
  newStatus: string;
  timestamp: string;
}

export interface MilestoneTask {
  _id?: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  completedAt?: string;
  startDate?: string;
  endDate?: string;
  assignedTo?: string | User;
  completionNote?: string;
}

export interface Milestone {
  _id: string;
  name: string;
  description?: string;
  dueDate?: string;
  status: "Pending" | "In Progress" | "Completed" | "On Hold";
  project: string | Project;
  organization: string | Organization;
  createdBy: string | User;
  tasks: MilestoneTask[];
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  _id: string;
  project: string | Project;
  organization: string | Organization;
  createdBy: string | User;
  createdByName: string;
  type: "Incoming" | "Outgoing" | "Debit Note" | "Purchase Payment";
  amount: number;
  date: string;
  paymentMethod: "Cash" | "Bank Transfer" | "Cheque" | "RTGS/NEFT" | "UPI" | "Adjustment" | "Other";
  partyName: string;
  referenceNumber?: string;
  category?: string;
  description?: string;
  linkedPurchase?: string | MaterialPurchase;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  _id: string;
  name: string;
  description?: string;
  category?: string | TemplateCategory;
  organization: string | Organization;
  createdBy: string | User;
  budgetMin?: number;
  budgetMax?: number;
  boqItems: TemplateBOQItem[];
  images: string[];
  status: "Draft" | "Active" | "Archived";
  createdAt: string;
  updatedAt: string;
}

export interface TemplateBOQItem {
  groupName: string;
  itemDescription: string;
  unit?: string;
  quantity: number;
  unitCost: number;
}

export interface TemplateCategory {
  _id: string;
  name: string;
  description?: string;
  organization: string | Organization;
  createdAt: string;
  updatedAt: string;
}

export interface SiteSurvey {
  _id: string;
  project: string | Project;
  organization: string | Organization;
  surveyedBy: string | User;
  surveyedByName: string;
  accessibility?: string;
  powerAvailability?: string;
  waterAvailability?: string;
  terrainType?: string;
  notes?: string;
  attachments: string[];
  budgetRecommendation?: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkProgress {
  _id: string;
  project: string | Project;
  organization: string | Organization;
  description: string;
  progressPercent: number;
  photos: string[];
  loggedBy: string | User;
  loggedByName: string;
  date: string;
  createdAt: string;
}

export interface PlanFolder {
  _id: string;
  name: string;
  project: string | Project;
  organization: string | Organization;
  documents: PlanDocument[];
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
}

export interface PlanDocument {
  _id?: string;
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
