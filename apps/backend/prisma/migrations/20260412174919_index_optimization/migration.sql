-- CreateIndex
CREATE INDEX "Assignment_subjectId_idx" ON "Assignment"("subjectId");

-- CreateIndex
CREATE INDEX "Assignment_createdBy_idx" ON "Assignment"("createdBy");

-- CreateIndex
CREATE INDEX "FundContributionLog_reporterId_idx" ON "FundContributionLog"("reporterId");

-- CreateIndex
CREATE INDEX "FundContributionLog_contributorId_idx" ON "FundContributionLog"("contributorId");

-- CreateIndex
CREATE INDEX "GalleryPost_userId_idx" ON "GalleryPost"("userId");
