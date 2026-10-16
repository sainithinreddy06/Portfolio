import type { Handler } from './types';
import { getPortfolioStore } from '../../server/portfolioStore';

export const handler: Handler = async () => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
  };

  try {
    const store = getPortfolioStore();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        lastUpdated: store.lastUpdated,
        content: store.content,
        syncedRepositories: store.syncedRepositories,
      }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};
