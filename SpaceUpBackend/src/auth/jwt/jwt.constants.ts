export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'fallback_secret_only_for_local_dev',
};
