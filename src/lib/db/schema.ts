import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  pgEnum,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const roleEnum = pgEnum("role", ["admin", "manager", "staff"]);
export const documentStatusEnum = pgEnum("document_status", [
  "draft",
  "active",
  "archived",
]);
export const trainingStatusEnum = pgEnum("training_status", [
  "pending",
  "acknowledged",
]);

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("staff"),
  department: text("department"),
  startDate: timestamp("start_date"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Documents table
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  department: text("department"),
  status: documentStatusEnum("status").notNull().default("draft"),
  currentVersionId: uuid("current_version_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
});

// Document versions table
export const documentVersions = pgTable("document_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  versionNumber: text("version_number").notNull(),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadedBy: uuid("uploaded_by")
    .notNull()
    .references(() => users.id),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  reviewDate: timestamp("review_date"),
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  changeSummary: text("change_summary"),
});

// Training assignments table
export const trainingAssignments = pgTable("training_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  assignedBy: uuid("assigned_by")
    .notNull()
    .references(() => users.id),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  dueDate: timestamp("due_date"),
});

// Training acknowledgements table
export const trainingAcknowledgements = pgTable("training_acknowledgements", {
  id: uuid("id").primaryKey().defaultRandom(),
  assignmentId: uuid("assignment_id")
    .notNull()
    .references(() => trainingAssignments.id, { onDelete: "cascade" })
    .unique(),
  acknowledgedAt: timestamp("acknowledged_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
});

// Audit log table
export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  uploadedVersions: many(documentVersions, {
    relationName: "uploader",
  }),
  approvedVersions: many(documentVersions, {
    relationName: "approver",
  }),
  trainingAssignments: many(trainingAssignments, {
    relationName: "assignee",
  }),
  assignedTrainings: many(trainingAssignments, {
    relationName: "assigner",
  }),
  auditLogs: many(auditLog),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [documents.createdBy],
    references: [users.id],
  }),
  currentVersion: one(documentVersions, {
    fields: [documents.currentVersionId],
    references: [documentVersions.id],
    relationName: "currentVersion",
  }),
  versions: many(documentVersions),
  trainingAssignments: many(trainingAssignments),
}));

export const documentVersionsRelations = relations(
  documentVersions,
  ({ one }) => ({
    document: one(documents, {
      fields: [documentVersions.documentId],
      references: [documents.id],
    }),
    uploadedByUser: one(users, {
      fields: [documentVersions.uploadedBy],
      references: [users.id],
      relationName: "uploader",
    }),
    approvedByUser: one(users, {
      fields: [documentVersions.approvedBy],
      references: [users.id],
      relationName: "approver",
    }),
  })
);

export const trainingAssignmentsRelations = relations(
  trainingAssignments,
  ({ one }) => ({
    document: one(documents, {
      fields: [trainingAssignments.documentId],
      references: [documents.id],
    }),
    user: one(users, {
      fields: [trainingAssignments.userId],
      references: [users.id],
      relationName: "assignee",
    }),
    assignedByUser: one(users, {
      fields: [trainingAssignments.assignedBy],
      references: [users.id],
      relationName: "assigner",
    }),
    acknowledgement: one(trainingAcknowledgements, {
      fields: [trainingAssignments.id],
      references: [trainingAcknowledgements.assignmentId],
    }),
  })
);

export const trainingAcknowledgementsRelations = relations(
  trainingAcknowledgements,
  ({ one }) => ({
    assignment: one(trainingAssignments, {
      fields: [trainingAcknowledgements.assignmentId],
      references: [trainingAssignments.id],
    }),
  })
);

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  user: one(users, {
    fields: [auditLog.userId],
    references: [users.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type DocumentVersion = typeof documentVersions.$inferSelect;
export type NewDocumentVersion = typeof documentVersions.$inferInsert;
export type TrainingAssignment = typeof trainingAssignments.$inferSelect;
export type NewTrainingAssignment = typeof trainingAssignments.$inferInsert;
export type TrainingAcknowledgement =
  typeof trainingAcknowledgements.$inferSelect;
export type NewTrainingAcknowledgement =
  typeof trainingAcknowledgements.$inferInsert;
export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;
