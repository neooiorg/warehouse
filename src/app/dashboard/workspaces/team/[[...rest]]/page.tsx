'use client';

import PageContainer from '@/components/layout/page-container';
import { OrganizationProfile } from '@clerk/nextjs';
import { teamInfoContent } from '@/config/infoconfig';

export default function TeamPage() {
  return (
    <PageContainer
      pageTitle='Quản lý đội nhóm'
      pageDescription='Quản lý thành viên, vai trò và bảo mật của tổ chức.'
      infoContent={teamInfoContent}
    >
      <OrganizationProfile />
    </PageContainer>
  );
}
