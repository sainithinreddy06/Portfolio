import { reportApiFailure } from '../../server/apiErrors';
import type { Handler } from './types';
import { getPortfolioStore } from '../../server/deployedPortfolioStore';

export const handler: Handler = async () => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
  };

  try {
    const store = await getPortfolioStore();
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
    reportApiFailure('portfolio', err);
    return {
      statusCode: 500,
      headers: { ...headers, 'Cache-Control': 'no-store' },
      body: JSON.stringify({ success: false, error: 'Portfolio service failed. Check function logs and database configuration.' }),
    };
  }
};
