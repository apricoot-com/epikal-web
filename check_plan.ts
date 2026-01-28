import { prisma } from './lib/prisma';
import { SUBSCRIPTION_PLANS } from './src/lib/subscription/plans';

async function main() {
  const company = await prisma.company.findFirst({
    where: { slug: 'clinica-aurora' }
  });
  
  if (company) {
    console.log('Company Tier:', company.subscriptionTier);
    const plan = SUBSCRIPTION_PLANS[company.subscriptionTier];
    console.log('Plan Object:', plan);
    console.log('Plan Name:', plan?.name);
  } else {
    console.log('Company not found');
  }
}

main();
