import { z } from 'zod';
import 'dotenv/config';

/**
 * Zod schema for all required environment variables.
 * Fails fast at startup if any required variable is missing or malformed.
 */
const EnvSchema = z.object({
  /** HTTP(S) RPC endpoint for the target chain */
  RPC_URL: z
    .string()
    .url({ message: 'RPC_URL must be a valid URL (e.g. https://evm-rpc.sei-apis.com)' }),

  /** ElitraVault proxy contract address (checksummed or lowercase hex) */
  VAULT_ADDRESS: z
    .string()
    .regex(/^0x[0-9a-fA-F]{40}$/, { message: 'VAULT_ADDRESS must be a valid 0x-prefixed Ethereum address' }),

  /** HTTP port the Fastify server listens on */
  PORT: z
    .string()
    .optional()
    .default('3000')
    .transform((v) => parseInt(v, 10))
    .refine((v) => !isNaN(v) && v > 0 && v < 65536, { message: 'PORT must be a valid port number' }),

  /** Runtime environment */
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type AppConfig = z.infer<typeof EnvSchema>;

let _config: AppConfig | null = null;

/**
 * Load and validate app configuration from environment variables.
 * Memoised — safe to call multiple times; validation only runs once.
 *
 * @throws {Error} if any required env var is missing or invalid
 */
export function loadConfig(): AppConfig {
  if (_config) return _config;

  const result = EnvSchema.safeParse(process.env);

  if (!result.success) {
    const messages = result.error.errors
      .map((e) => `  • ${e.path.join('.')}: ${e.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${messages}`);
  }

  _config = result.data;
  return _config;
}

/** Reset cached config (useful in tests) */
export function _resetConfig(): void {
  _config = null;
}
