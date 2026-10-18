import { handlePortfolioAsset } from '../../server/portfolioAssets';
export default async (request: Request) => handlePortfolioAsset(request, 'resume');

export const config = { path: ['/api/portfolio/resume', '/api/portfolio/resume/*'] };
