-- DropForeignKey
ALTER TABLE "email_deliveries" DROP CONSTRAINT "email_deliveries_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "notification_preferences" DROP CONSTRAINT "notification_preferences_user_id_fkey";

-- DropForeignKey
ALTER TABLE "ownership_transfers" DROP CONSTRAINT "ownership_transfers_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "ownership_transfers" DROP CONSTRAINT "ownership_transfers_requested_by_id_fkey";

-- DropForeignKey
ALTER TABLE "ownership_transfers" DROP CONSTRAINT "ownership_transfers_target_user_id_fkey";

-- DropForeignKey
ALTER TABLE "platform_administrators" DROP CONSTRAINT "platform_administrators_user_id_fkey";

-- DropForeignKey
ALTER TABLE "platform_audit_logs" DROP CONSTRAINT "platform_audit_logs_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "platform_audit_logs" DROP CONSTRAINT "platform_audit_logs_user_id_fkey";

-- AlterTable
ALTER TABLE "email_deliveries" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "notification_preferences" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ownership_transfers" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "platform_administrators" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "platform_audit_logs" ALTER COLUMN "id" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_administrators" ADD CONSTRAINT "platform_administrators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_audit_logs" ADD CONSTRAINT "platform_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ownership_transfers" ADD CONSTRAINT "ownership_transfers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ownership_transfers" ADD CONSTRAINT "ownership_transfers_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ownership_transfers" ADD CONSTRAINT "ownership_transfers_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_deliveries" ADD CONSTRAINT "email_deliveries_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "email_deliveries_organization_created_idx" RENAME TO "email_deliveries_organization_id_created_at_idx";

-- RenameIndex
ALTER INDEX "email_deliveries_status_created_idx" RENAME TO "email_deliveries_status_created_at_idx";

-- RenameIndex
ALTER INDEX "ownership_transfers_organization_status_created_idx" RENAME TO "ownership_transfers_organization_id_status_created_at_idx";

-- RenameIndex
ALTER INDEX "ownership_transfers_target_status_idx" RENAME TO "ownership_transfers_target_user_id_status_idx";

-- RenameIndex
ALTER INDEX "platform_audit_logs_created_idx" RENAME TO "platform_audit_logs_created_at_idx";

-- RenameIndex
ALTER INDEX "platform_audit_logs_organization_created_idx" RENAME TO "platform_audit_logs_organization_id_created_at_idx";

-- RenameIndex
ALTER INDEX "platform_audit_logs_user_created_idx" RENAME TO "platform_audit_logs_user_id_created_at_idx";
