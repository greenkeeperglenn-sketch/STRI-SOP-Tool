import type {
  User,
  Document,
  DocumentVersion,
  TrainingAssignment,
  TrainingAcknowledgement,
  AuditLog,
} from "./db/schema";

export type { User, Document, DocumentVersion, TrainingAssignment, TrainingAcknowledgement, AuditLog };

export type UserRole = "admin" | "manager" | "staff";
export type DocumentStatus = "draft" | "active" | "archived";
export type TrainingStatus = "pending" | "acknowledged";

export type ActionResult<T = undefined> = {
  success: boolean;
  error?: string;
  data?: T;
};

export type DocumentWithVersion = Document & {
  currentVersion: DocumentVersion | null;
  createdByUser: Pick<User, "id" | "name" | "email"> | null;
};

export type DocumentWithVersions = Document & {
  currentVersion: DocumentVersion | null;
  versions: DocumentVersion[];
  createdByUser: Pick<User, "id" | "name" | "email"> | null;
};

export type TrainingAssignmentWithDetails = TrainingAssignment & {
  document: Pick<Document, "id" | "title" | "category"> & {
    currentVersion: Pick<DocumentVersion, "id" | "versionNumber" | "reviewDate"> | null;
  };
  user: Pick<User, "id" | "name" | "email" | "department">;
  assignedByUser: Pick<User, "id" | "name">;
  acknowledgement: TrainingAcknowledgement | null;
};

export type AuditLogWithUser = AuditLog & {
  user: Pick<User, "id" | "name" | "email"> | null;
};

export type DashboardStats = {
  totalActiveSOPs: number;
  sopsDueForReview: number;
  compliancePercentage: number;
  overdueTraining: number;
  totalStaff: number;
  totalAssignments: number;
  acknowledgedAssignments: number;
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string | null;
};
