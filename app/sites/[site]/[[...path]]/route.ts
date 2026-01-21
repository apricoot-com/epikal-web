import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import mime from "mime";
import { marked } from "marked";
import { prisma } from "@/src/server/db/client";

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ site: string; path?: string[] }> }
) {
    const params = await props.params;
    const domain = decodeURIComponent(params.site);
    const pathSegments = params.path || [];
    const urlPath = pathSegments.join("/");

    // 1. Resolve Tenant
    // Define include object to reuse
    const companyInclude = {
        siteTemplate: true,
        branding: true,
        services: {
            where: { isPublic: true },
            include: { webPage: true, resources: true },
            orderBy: { sortOrder: 'asc' }
        }
    };

    let company;
    const isLocal = domain.includes("localhost");

    if (isLocal) {
        const slug = domain.split(".")[0];
        company = await prisma.company.findUnique({
            where: { slug },
            include: companyInclude as any
        });
    } else {
        const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "epikal.com";
        if (domain.endsWith(`.${rootDomain}`)) {
            const slug = domain.replace(`.${rootDomain}`, "");
            company = await prisma.company.findUnique({
                where: { slug },
                include: companyInclude as any
            });
        } else {
            company = await prisma.company.findUnique({
                where: { customDomain: domain },
                include: companyInclude as any
            });
        }
    }


    if (!company) {
        const slug = isLocal ? domain.split(".")[0] : "prod";
        return new NextResponse(`Site not found for domain: ${domain}, extracted slug: ${slug}`, { status: 404 });
    }

    if (!company.siteTemplate) {
        return new NextResponse("No template configured for this site", { status: 404 });
    }

    // 2. Resolve File & Route Logic
    const templatePath = path.join(process.cwd(), "public", "templates", company.siteTemplate.storagePath);
    const hasExtension = urlPath.includes(".");

    if (hasExtension) {
        // Asset Proxy
        const safePath = path.normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/, '');
        const fullPath = path.join(templatePath, safePath);
        if (fs.existsSync(fullPath)) {
            const fileBuffer = fs.readFileSync(fullPath);
            const contentType = mime.getType(fullPath) || "application/octet-stream";
            return new NextResponse(fileBuffer, { headers: { "Content-Type": contentType } });
        } else {
            return new NextResponse("Asset not found", { status: 404 });
        }
    }

    // Page Routing
    let fileToRead = "index.html";
    let pageContext: any = {};

    // Custom Route Logic
    if (urlPath === "services") {
        // Could map to services.html if exists, otherwise index with context
        if (fs.existsSync(path.join(templatePath, "services.html"))) {
            fileToRead = "services.html";
        }
    } else if (pathSegments[0] === "services" && pathSegments[1]) {
        // Service Detail Page: /services/[slug]
        const serviceSlug = pathSegments[1];
        const service = company.services.find((s: any) => s.webPage?.slug === serviceSlug);

        if (service) {
            if (fs.existsSync(path.join(templatePath, "service-detail.html"))) {
                fileToRead = "service-detail.html";
                const rawContent = service.webPage?.content || service.description || "";

                pageContext = {
                    type: "service-detail",
                    data: {
                        ...service,
                        htmlContent: await marked(rawContent), // Render markdown
                        webPage: service.webPage
                    }
                };
            } else {
                // Fallback if template doesn't support details?
                // For now, 404 if no template file
                return new NextResponse("Template does not support service details", { status: 404 });
            }
        } else {
            return new NextResponse("Service not found", { status: 404 });
        }
    } else if (urlPath) {
        // Generic static pages (about, contact)
        if (fs.existsSync(path.join(templatePath, `${urlPath}.html`))) {
            fileToRead = `${urlPath}.html`;
        } else if (fs.existsSync(path.join(templatePath, urlPath, "index.html"))) {
            fileToRead = path.join(urlPath, "index.html");
        } else {
            return new NextResponse("Page not found", { status: 404 });
        }
    }

    const fullPagePath = path.join(templatePath, fileToRead);
    const htmlContent = fs.readFileSync(fullPagePath, "utf-8");

    // 3. Prepare Data
    const branding = company.branding || {
        primaryColor: "#000000",
        secondaryColor: "#ffffff",
        logoUrl: "",
    };

    const siteSettings = (company.siteSettings as any) || {};

    // Block Resolving Logic
    // Default to "home" page config for root
    let pageConfigKey = "home";
    if (urlPath === "about") pageConfigKey = "about";
    if (urlPath === "contact") pageConfigKey = "contact";
    if (urlPath === "services") pageConfigKey = "services";

    const blocks = siteSettings.pages?.[pageConfigKey]?.blocks || [];

    const templateData = {
        settings: siteSettings,
        blocks: blocks, // Inject blocks here
        company: {
            name: company.name,
            email: siteSettings.contact?.email || "contact@" + domain,
            phone: siteSettings.contact?.phone || branding.brandKeywords?.join(", ") || "",
            // Use configured hero or fallback to company name
            heroTitle: siteSettings.home?.heroTitle || company.name,
            heroDescription: siteSettings.home?.heroDescription || "Tu clínica de confianza.",
            heroImage: siteSettings.home?.heroImage,
            social: company.socialUrls || {}, // { facebook, instagram, ... }
            branding: {
                colors: {
                    primary: branding.primaryColor,
                    secondary: branding.secondaryColor,
                },
                logo: branding.logoUrl,
            },
            services: company.services.map((s: any) => ({
                name: s.name,
                slug: s.webPage?.slug,
                description: s.description,
                price: s.price,
                image: s.webPage?.heroImage
            }))
        },
        context: {
            path: urlPath,
            ...pageContext
        }
    };

    // 4. Inject
    const scriptInjection = `<script>window.TEMPLATE_DATA = ${JSON.stringify(templateData)};</script>`;
    const finalHtml = htmlContent.replace("</head>", `${scriptInjection}</head>`);

    return new NextResponse(finalHtml, {
        headers: { "Content-Type": "text/html" }
    });
}
