import { prisma } from './lib/prisma';
import { SUBSCRIPTION_PLANS } from './src/lib/subscription/plans';

async function main() {
  const company = await prisma.company.findFirst({
    where: { slug: 'clinica-aurora' }
  });

  if (company) {
    const subData = (company.subscriptionData as any) || {};
    const tier = subData.tier || 'FREE';
    console.log('Company Tier:', tier);
    const plan = SUBSCRIPTION_PLANS[tier as keyof typeof SUBSCRIPTION_PLANS];
    console.log('Plan Object:', plan);
    console.log('Plan Name:', plan?.name);
  } else {
    console.log('Company not found');
  }
}

main();
