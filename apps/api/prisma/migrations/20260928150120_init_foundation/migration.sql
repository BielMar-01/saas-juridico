-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "OrganizationRole" AS ENUM ('OWNER', 'ADMIN', 'LAWYER', 'ASSISTANT', 'FINANCIAL', 'VIEWER');

-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('INDIVIDUAL', 'LEGAL_ENTITY');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ON_HOLD', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LawsuitStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "DocumentVisibility" AS ENUM ('INTERNAL', 'CLIENT_PORTAL', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('REQUESTED', 'UPLOADED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REPLACED', 'WAIVED', 'QUARANTINED');

-- CreateEnum
CREATE TYPE "PublicationType" AS ENUM ('STATUS_UPDATE', 'NEXT_STEP', 'DOCUMENT_REQUEST', 'MESSAGE', 'DOCUMENT');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "auth_user_id" UUID,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'INVITED',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_memberships" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "OrganizationRole" NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'INVITED',
    "invited_at" TIMESTAMPTZ(3),
    "accepted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "organization_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "type" "ClientType" NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cases" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "CaseStatus" NOT NULL DEFAULT 'DRAFT',
    "responsible_user_id" UUID,
    "readiness_score" SMALLINT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lawsuits" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "case_number" TEXT NOT NULL,
    "court" TEXT,
    "jurisdiction" TEXT,
    "status" "LawsuitStatus" NOT NULL DEFAULT 'ACTIVE',
    "filed_at" DATE,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "lawsuits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "case_id" UUID,
    "assigned_to_user_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "due_at" TIMESTAMPTZ(3),
    "completed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "case_id" UUID,
    "client_id" UUID,
    "uploaded_by_user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "visibility" "DocumentVisibility" NOT NULL DEFAULT 'INTERNAL',
    "status" "DocumentStatus" NOT NULL DEFAULT 'QUARANTINED',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_portal_publications" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "created_by_user_id" UUID NOT NULL,
    "type" "PublicationType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "published_at" TIMESTAMPTZ(3) NOT NULL,
    "revoked_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "client_portal_publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID,
    "metadata" JSONB,
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_user_id_key" ON "users"("auth_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_status_idx" ON "organizations"("status");

-- CreateIndex
CREATE INDEX "organization_memberships_organization_id_status_idx" ON "organization_memberships"("organization_id", "status");

-- CreateIndex
CREATE INDEX "organization_memberships_user_id_status_idx" ON "organization_memberships"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "organization_memberships_organization_id_user_id_key" ON "organization_memberships"("organization_id", "user_id");

-- CreateIndex
CREATE INDEX "clients_organization_id_status_idx" ON "clients"("organization_id", "status");

-- CreateIndex
CREATE INDEX "clients_organization_id_name_idx" ON "clients"("organization_id", "name");

-- CreateIndex
CREATE INDEX "clients_organization_id_document_idx" ON "clients"("organization_id", "document");

-- CreateIndex
CREATE INDEX "clients_organization_id_deleted_at_idx" ON "clients"("organization_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "clients_organization_id_id_key" ON "clients"("organization_id", "id");

-- CreateIndex
CREATE INDEX "cases_organization_id_status_idx" ON "cases"("organization_id", "status");

-- CreateIndex
CREATE INDEX "cases_organization_id_client_id_idx" ON "cases"("organization_id", "client_id");

-- CreateIndex
CREATE INDEX "cases_organization_id_responsible_user_id_idx" ON "cases"("organization_id", "responsible_user_id");

-- CreateIndex
CREATE INDEX "cases_organization_id_deleted_at_idx" ON "cases"("organization_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "cases_organization_id_id_key" ON "cases"("organization_id", "id");

-- CreateIndex
CREATE INDEX "lawsuits_organization_id_case_id_idx" ON "lawsuits"("organization_id", "case_id");

-- CreateIndex
CREATE INDEX "lawsuits_organization_id_status_idx" ON "lawsuits"("organization_id", "status");

-- CreateIndex
CREATE INDEX "lawsuits_organization_id_deleted_at_idx" ON "lawsuits"("organization_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "lawsuits_organization_id_case_number_key" ON "lawsuits"("organization_id", "case_number");

-- CreateIndex
CREATE INDEX "tasks_organization_id_status_due_at_idx" ON "tasks"("organization_id", "status", "due_at");

-- CreateIndex
CREATE INDEX "tasks_organization_id_case_id_idx" ON "tasks"("organization_id", "case_id");

-- CreateIndex
CREATE INDEX "tasks_organization_id_assigned_to_user_id_status_idx" ON "tasks"("organization_id", "assigned_to_user_id", "status");

-- CreateIndex
CREATE INDEX "tasks_organization_id_deleted_at_idx" ON "tasks"("organization_id", "deleted_at");

-- CreateIndex
CREATE INDEX "documents_organization_id_status_idx" ON "documents"("organization_id", "status");

-- CreateIndex
CREATE INDEX "documents_organization_id_case_id_idx" ON "documents"("organization_id", "case_id");

-- CreateIndex
CREATE INDEX "documents_organization_id_client_id_idx" ON "documents"("organization_id", "client_id");

-- CreateIndex
CREATE INDEX "documents_organization_id_deleted_at_idx" ON "documents"("organization_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "documents_organization_id_storage_path_key" ON "documents"("organization_id", "storage_path");

-- CreateIndex
CREATE INDEX "client_portal_publications_organization_id_case_id_publishe_idx" ON "client_portal_publications"("organization_id", "case_id", "published_at");

-- CreateIndex
CREATE INDEX "client_portal_publications_organization_id_revoked_at_idx" ON "client_portal_publications"("organization_id", "revoked_at");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_created_at_idx" ON "audit_logs"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_entity_type_entity_id_idx" ON "audit_logs"("organization_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_user_id_created_at_idx" ON "audit_logs"("organization_id", "user_id", "created_at");

-- AddForeignKey
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_organization_id_client_id_fkey" FOREIGN KEY ("organization_id", "client_id") REFERENCES "clients"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_organization_id_responsible_user_id_fkey" FOREIGN KEY ("organization_id", "responsible_user_id") REFERENCES "organization_memberships"("organization_id", "user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lawsuits" ADD CONSTRAINT "lawsuits_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lawsuits" ADD CONSTRAINT "lawsuits_organization_id_case_id_fkey" FOREIGN KEY ("organization_id", "case_id") REFERENCES "cases"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_organization_id_case_id_fkey" FOREIGN KEY ("organization_id", "case_id") REFERENCES "cases"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_organization_id_assigned_to_user_id_fkey" FOREIGN KEY ("organization_id", "assigned_to_user_id") REFERENCES "organization_memberships"("organization_id", "user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_organization_id_case_id_fkey" FOREIGN KEY ("organization_id", "case_id") REFERENCES "cases"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_organization_id_client_id_fkey" FOREIGN KEY ("organization_id", "client_id") REFERENCES "clients"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_organization_id_uploaded_by_user_id_fkey" FOREIGN KEY ("organization_id", "uploaded_by_user_id") REFERENCES "organization_memberships"("organization_id", "user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_portal_publications" ADD CONSTRAINT "client_portal_publications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_portal_publications" ADD CONSTRAINT "client_portal_publications_organization_id_case_id_fkey" FOREIGN KEY ("organization_id", "case_id") REFERENCES "cases"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_portal_publications" ADD CONSTRAINT "client_portal_publications_organization_id_created_by_user_fkey" FOREIGN KEY ("organization_id", "created_by_user_id") REFERENCES "organization_memberships"("organization_id", "user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_user_id_fkey" FOREIGN KEY ("organization_id", "user_id") REFERENCES "organization_memberships"("organization_id", "user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
