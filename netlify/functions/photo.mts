import { handlePortfolioAsset } from '../../server/portfolioAssets';
export default async (request: Request) => handlePortfolioAsset(request, 'photo');

export const config = { path: ['/api/portfolio/photo', '/api/portfolio/photo/*'] };
