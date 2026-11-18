export default async function handler(req: any, res: any) {
  let mod: any;
  try {
    mod = await import('../server');
  } catch (err: any) {
    res.status(500).json({
      stage: 'import',
      message: String(err?.message ?? err),
      stack: String(err?.stack ?? '').split('\n').slice(0, 8),
    });
    return;
  }
  return mod.default(req, res);
}
