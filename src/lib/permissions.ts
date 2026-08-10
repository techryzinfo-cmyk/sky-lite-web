/**
 * Resolve the user's role scoped to a specific project (found via
 * project.members). A project-specific role assignment is authoritative
 * for that project — it must not be bypassed by a broader global role,
 * otherwise a deliberately restrictive project role (e.g. "Viewer") could
 * never actually restrict a member whose org-wide default role happens to
 * have more permissions.
 *
 * When there's no project at all (project is null — e.g. checking
 * "projects:create" on the projects list, before any project exists to be
 * a member of), there's nothing for a project-specific role to be
 * authoritative over, so fall back to the user's global role. This is
 * distinct from the "project exists but user isn't a member" case, which
 * intentionally stays restrictive (returns null, no fallback).
 */
const resolveProjectRole = (user: any, project: any): any => {
  if (!project) return user?.role || null;
  if (!Array.isArray(project.members)) return null;
  const currentUserId = user?._id || user?.id;
  const myMember = project.members.find((m: any) => {
    const mUserId = m.user?._id || m.user;
    return mUserId === currentUserId;
  });
  return myMember?.role || null;
};

/**
 * Check if the user is a global admin or wildcard holder (always allowed),
 * otherwise check ONLY their project-specific role's permissions.
 */
export const hasProjectPermission = (user: any, project: any, permission: string): boolean => {
  if (!user) return false;
  if (user?.role?.name === 'Admin' || user?.role?.permissions?.includes('*')) {
    return true;
  }

  const myRole = resolveProjectRole(user, project);
  if (!myRole) return false;
  if (myRole.name === 'Admin' || myRole.permissions?.includes('*')) return true;
  return myRole.permissions?.includes(permission) ?? false;
};

export const hasAnyProjectPermissionPrefix = (user: any, project: any, prefix: string): boolean => {
  if (!user) return false;
  if (user?.role?.name === 'Admin' || user?.role?.permissions?.includes('*')) {
    return true;
  }

  const myRole = resolveProjectRole(user, project);
  if (!myRole) return false;
  if (myRole.name === 'Admin' || myRole.permissions?.includes('*')) return true;
  return myRole.permissions?.some((p: string) => p.startsWith(prefix)) ?? false;
};

/**
 * Check if the project is in a locked status, which should prevent any modifying actions.
 * Mirrors sky-lite (mobile) app/utils/permissions.js#isProjectLocked exactly.
 */
export const isProjectLocked = (project: any): boolean => {
  if (!project || !project.status) return false;
  return ['Completed', 'Handover Completed', 'Cancelled'].includes(project.status);
};

export const hasProjectPermissionWithMembers = (user: any, projectMembers: any[], permission: string): boolean => {
  if (!user) return false;
  if (user?.role?.name === 'Admin' || user?.role?.permissions?.includes('*')) {
    return true;
  }

  if (Array.isArray(projectMembers)) {
    const currentUserId = user?._id || user?.id;
    const myMember = projectMembers.find((m: any) => {
      const mUserId = m.user?._id || m.user;
      return mUserId === currentUserId;
    });

    const myRole = myMember?.role;
    if (!myRole) return false;
    if (myRole.name === 'Admin' || myRole.permissions?.includes('*')) return true;
    return myRole.permissions?.includes(permission) ?? false;
  }

  return false;
};
