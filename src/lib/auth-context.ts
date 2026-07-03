import { auth } from '@clerk/nextjs/server';

export class UnauthorizedError extends Error {
  constructor(message = 'Chưa đăng nhập') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class NoOrganizationError extends Error {
  constructor(message = 'Chưa chọn tổ chức đang hoạt động') {
    super(message);
    this.name = 'NoOrganizationError';
  }
}

// Every table in src/db/schema is org-scoped. This is the single choke point
// every service.ts must call before touching the database, so org scoping
// can never be forgotten on a new query.
export async function requireOrgContext() {
  const { userId, orgId } = await auth();
  if (!userId) throw new UnauthorizedError();
  if (!orgId) throw new NoOrganizationError();
  return { userId, orgId };
}
