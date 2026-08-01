import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const value = (name) => {
  const raw = process.env[name];
  return typeof raw === 'string' ? raw.trim() : '';
};

/**
 * This route deliberately has no top-level imports from the application
 * configuration or database modules. If production variables are missing or a
 * server dependency cannot initialize, the health endpoint must still load and
 * report the failed layer without exposing any environment-variable values.
 */
export const GET = async () => {
  const databaseUrl = value('DATABASE_URL');
  const hasDiscreteDatabase = Boolean(
    value('SUPABASE_DB_HOST') &&
      value('SUPABASE_DB_USER') &&
      value('SUPABASE_DB_PASSWORD')
  );
  const databaseConfigured = Boolean(databaseUrl || hasDiscreteDatabase);
  const databaseUrlFormat =
    !databaseUrl
      ? 'not_set'
      : /^postgres(?:ql)?:\/\//i.test(databaseUrl)
        ? 'valid'
        : 'invalid';
  const jwtConfigured = value('JWT_SECRET').length >= 32;

  let database = databaseConfigured ? 'unavailable' : 'not_configured';
  let databaseError = null;
  let databaseErrorType = null;
  let databaseErrorCode = null;

  if (databaseConfigured && jwtConfigured) {
    try {
      const { connectDB } = await import('@/lib/config/db');
      await connectDB();
      database = 'ok';
    } catch (error) {
      databaseErrorType =
        typeof error?.name === 'string' ? error.name.slice(0, 80) : 'Error';
      const code = error?.original?.code || error?.parent?.code || error?.code;
      databaseErrorCode =
        typeof code === 'string' && /^[A-Z0-9_]+$/.test(code)
          ? code.slice(0, 40)
          : null;
      databaseError =
        databaseErrorType.startsWith('Sequelize')
          ? 'connection_failed'
          : 'initialization_failed';
    }
  }

  let ai = { provider: 'unknown', configured: false };
  if (databaseConfigured && jwtConfigured) {
    try {
      const { providerStatus } = await import('@/lib/services/ai');
      ai = await providerStatus();
    } catch {
      ai = { provider: 'unknown', configured: false, error: 'unavailable' };
    }
  }

  const status =
    database === 'ok' && jwtConfigured && databaseUrlFormat !== 'invalid'
      ? 'ok'
      : 'degraded';

  return NextResponse.json(
    {
      status,
      environment: process.env.NODE_ENV || 'unknown',
      configuration: {
        databaseConfigured,
        databaseUrlFormat,
        jwtConfigured,
      },
      database,
      ...(databaseError && { databaseError }),
      ...(databaseErrorType && { databaseErrorType }),
      ...(databaseErrorCode && { databaseErrorCode }),
      ai,
    },
    {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    }
  );
};
