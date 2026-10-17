import { verifyAdminToken } from '../../server/deployedAuthService';
import { getPortfolioStore, savePortfolioStore } from '../../server/deployedPortfolioStore';
import { isPortfolioContent } from '../../server/portfolioValidation';
import { reportApiFailure } from '../../server/apiErrors';

export default async (request: Request) => {
  const json = (body: object, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
  if (request.method !== 'POST') return Response.json({ success: false, error: 'Method not allowed.' }, { status: 405, headers: { Allow: 'POST' } });
  try {
    const authorization = request.headers.get('authorization');
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : request.headers.get('x-admin-token') || undefined;
    if (!(await verifyAdminToken(token)).valid) return json({ success: false, requiresLogin: true, error: 'Valid admin session required.' }, 401);
    let body;
    try { body = await request.json(); } catch { return json({ success: false, error: 'Request body must be valid JSON.' }, 400); }
    if (!isPortfolioContent(body?.content)) return json({ success: false, error: 'A complete portfolio content object with valid profile, projects, and safe URLs is required.' }, 400);
    const store = await getPortfolioStore();
    store.content = body.content;
    await savePortfolioStore(store);
    return json({ success: true, message: 'Portfolio saved successfully.', content: store.content });
  } catch (error) {
    reportApiFailure('save', error);
    return json({ success: false, error: 'Portfolio could not be saved. Check database availability and function logs.' }, 503);
  }
};

export const config = { path: ['/api/portfolio/save'] };
