/** Fields safe to expose to the client. */
export const publicUserSelect = {
  id: true,
  email: true,
  username: true,
  name: true,
  role: true,
  bio: true,
  avatarColor: true,
  avatarUrl: true,
  createdAt: true,
};

/** Shape a Prisma user row for API responses. */
export function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
    role: user.role,
    bio: user.bio ?? null,
    avatarColor: user.avatarColor ?? "#06B6D4",
    avatarUrl: user.avatarUrl ?? null,
    createdAt: user.createdAt,
  };
}
