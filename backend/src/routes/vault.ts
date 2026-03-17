/**
 * vault.ts — Fastify route plugin for vault state endpoints.
 *
 * Routes:
 *   GET /vault/state   → Full vault state snapshot
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { readVaultState } from '../../tools/vaultStateReader';
import type { VaultStateResponse, ErrorResponse } from '../types/vault';

export async function vaultRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /vault/state
   *
   * Returns a full snapshot of the ElitraVault on-chain state.
   * No authentication required — read-only endpoint.
   */
  fastify.get(
    '/vault/state',
    {
      schema: {
        description: 'Fetch live ElitraVault state (PPS, total assets, NAV freshness, fees, pause state)',
        tags: ['vault'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  vaultAddress: { type: 'string' },
                  chainId: { type: 'number' },
                  snapshotTimestamp: { type: 'number' },
                  totalAssets: { type: 'string' },
                  totalSupply: { type: 'string' },
                  pricePerShare: { type: 'string' },
                  availableBalance: { type: 'string' },
                  aggregatedUnderlyingBalances: { type: 'string' },
                  totalPendingAssets: { type: 'string' },
                  lastTimestampUpdated: { type: 'number' },
                  navFreshnessThreshold: { type: 'number' },
                  navAgeSeconds: { type: 'number' },
                  navIsFresh: { type: 'boolean' },
                  isPaused: { type: 'boolean' },
                  feeOnDeposit: { type: 'string' },
                  feeOnWithdraw: { type: 'string' },
                  feeOnQueuedRedeem: { type: 'string' },
                  feeRecipient: { type: 'string' },
                  pendingFees: { type: 'string' },
                },
              },
            },
          },
          500: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              details: { type: 'string' },
            },
          },
        },
      },
    },
    async (
      _request: FastifyRequest,
      reply: FastifyReply,
    ): Promise<VaultStateResponse | ErrorResponse> => {
      try {
        const state = await readVaultState();
        const response: VaultStateResponse = { success: true, data: state };
        return reply.code(200).send(response);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        fastify.log.error({ err }, 'Failed to read vault state');
        const response: ErrorResponse = {
          success: false,
          error: 'Failed to read vault state from chain',
          details: message,
        };
        return reply.code(500).send(response);
      }
    },
  );
}
