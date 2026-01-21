import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import mime from "mime";
import { prisma } from "@/src/server/db/client";

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ site: string; path?: string[] }> }
) {
    const params = await props.params;
    const domain = decodeURIComponent(params.site);
    // params.path is undefined for root, or array of segments
    const pathSegments = params.path || [];
    const urlPath = pathSegments.join("/");

    // 1. Resolve Tenant
    let company;
    const isLocal = domain.includes("localhost");

    // Find company logic
    if (isLocal) {
        const slug = domain.split(".")[0];
        company = await prisma.company.findUnique({
            where: { slug },
            include: { siteTemplate: true, branding: true }
        });
    } else {
        const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "epikal.com";
        if (domain.endsWith(`.${rootDomain}`)) {
            const slug = domain.replace(`.${rootDomain}`, "");
            company = await prisma.company.findUnique({
                where: { slug },
                include: { siteTemplate: true, branding: true }
            });
        } else {
            company = await prisma.company.findUnique({
                where: { customDomain: domain },
                include: { siteTemplate: true, branding: true }
            });
        }
    }

    if (!company) {
        // Debug info
        const slug = isLocal ? domain.split(".")[0] : "prod";
        return new NextResponse(`Site not found for domain: ${domain}, extracted slug: ${slug}`, { status: 404 });
    }

    if (!company.siteTemplate) {
        return new NextResponse("No template configured for this site", { status: 404 });
    }

    // 2. Resolve File
    // If explicit extension (css, js, png), serve as asset
    // If no extension, assume HTML page

    const templatePath = path.join(
        process.cwd(),
        "public",
        "templates",
        company.siteTemplate.storagePath
    );

    const hasExtension = urlPath.includes("."); // distinct from no-extension route like /about

    if (hasExtension) {
        // Asset Proxy
        const safePath = path.normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/, '');
        const fullPath = path.join(templatePath, safePath);

        if (fs.existsSync(fullPath)) {
            const fileBuffer = fs.readFileSync(fullPath);
            const contentType = mime.getType(fullPath) || "application/octet-stream";
            return new NextResponse(fileBuffer, {
                headers: { "Content-Type": contentType }
            });
        } else {
            return new NextResponse("Asset not found", { status: 404 });
        }
    }

    // It's a Page (HTML)
    let fileToRead = "";

    if (!urlPath) {
        fileToRead = "index.html";
    } else {
        // Try exact match .html
        if (fs.existsSync(path.join(templatePath, `${urlPath}.html`))) {
            fileToRead = `${urlPath}.html`;
        }
        // Try directory index.html
        else if (fs.existsSync(path.join(templatePath, urlPath, "index.html"))) {
            fileToRead = path.join(urlPath, "index.html");
        }
        else {
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

    const templateData = {
        company: {
            name: company.name,
            email: "contact@" + domain,
            phone: branding.brandKeywords?.join(", ") || "",
            branding: {
                colors: {
                    primary: branding.primaryColor,
                    secondary: branding.secondaryColor,
                },
                logo: branding.logoUrl,
            },
        },
        context: {
            path: urlPath,
        }
    };

    // 4. Inject
    const scriptInjection = `<script>window.TEMPLATE_DATA = ${JSON.stringify(templateData)};</script>`;
    const finalHtml = htmlContent.replace("</head>", `${scriptInjection}</head>`);

    // 5. Response
    return new NextResponse(finalHtml, {
        headers: { "Content-Type": "text/html" }
    });
}
