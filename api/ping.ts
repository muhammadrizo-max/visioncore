export default function handler(_req: any, res: any) {
  res.json({
    node: process.version,
    env: {
      SESSION_SECRET: Boolean(process.env.SESSION_SECRET),
      SESSION_SECRET_length: process.env.SESSION_SECRET?.length ?? 0,
      OWNER_USERNAME: Boolean(process.env.OWNER_USERNAME),
      OWNER_PASSWORD: Boolean(process.env.OWNER_PASSWORD),
      SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    },
  });
}
