import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CancelWizard from "@/src/components/site/booking/CancelWizard";

export default async function CancelPage(props: {
    params: Promise<{ site: string }>;
    searchParams: Promise<{ token?: string | string[] }>;
}) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const domain = decodeURIComponent(params.site);
    const token = typeof searchParams.token === 'string' ? searchParams.token : undefined;

    if (!token) return notFound();

    // Verify company exists
    const company = await prisma.company.findFirst({
        where: {
            OR: [
                { slug: domain },
                { customDomain: domain }
            ]
        },
        include: {
            branding: true
        }
    });

    if (!company) return notFound();

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <CancelWizard token={token} />

            {/* Simple Footer */}
            <div className="mt-8 text-center text-sm text-slate-400">
                <p>&copy; {new Date().getFullYear()} {company.name}</p>
            </div>
        </div>
    );
}
