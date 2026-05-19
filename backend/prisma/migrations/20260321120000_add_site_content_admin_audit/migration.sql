-- CreateTable (AdminAuditLog đã có thể tồn tại nếu DB được sync bằng db push)
CREATE TABLE "SiteContent" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteContent_pkey" PRIMARY KEY ("key")
);
