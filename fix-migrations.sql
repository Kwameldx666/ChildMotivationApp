-- Add missing migrations to history
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion") 
VALUES ('20260120102049_AddAssignedToUserId', '10.0.1');

-- Add UpdatedAt column
ALTER TABLE tasks ADD COLUMN "UpdatedAt" timestamp with time zone;

-- Create task_comments table
CREATE TABLE task_comments (
    "Id" uuid NOT NULL,
    "TaskId" uuid NOT NULL,
    "UserId" character varying(64) NOT NULL,
    "UserName" character varying(256) NOT NULL,
    "UserRole" character varying(32) NOT NULL,
    "Content" character varying(2000) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    CONSTRAINT "PK_task_comments" PRIMARY KEY ("Id")
);

-- Create indexes
CREATE INDEX "IX_task_comments_CreatedAt" ON task_comments ("CreatedAt");
CREATE INDEX "IX_task_comments_TaskId" ON task_comments ("TaskId");

-- Add to migrations history
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion") 
VALUES ('20260121121137_AddComments', '10.0.1');
