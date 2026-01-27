import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { auth } from "../src/lib/auth";
import { randomUUID } from "crypto";
import { addDays, subDays, startOfHour, setHours } from "date-fns";

/**
 * Seed script for Epikal database
 * Refined version for full system testing with rich content
 */

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Starting full database seed with rich content...\n");

    // Clean existing data
    console.log("🧹 Cleaning existing data...");
    await prisma.userCompany.deleteMany();
    await prisma.companyBranding.deleteMany();
    await prisma.location.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.verification.deleteMany();
    await prisma.availability.deleteMany();
    await prisma.blockout.deleteMany();
    await prisma.serviceResource.deleteMany();
    await prisma.serviceWebPage.deleteMany();
    await prisma.service.deleteMany();
    await prisma.resource.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();
    await prisma.template.deleteMany();

    // =========================================================================
    // 1. PROJECT ADMIN COMPANY (System Level)
    // =========================================================================
    console.log("🚀 Creating System HQ...");
    const systemCompany = await prisma.company.create({
        data: {
            name: "Epikal Headquarters",
            slug: "system",
            status: "ACTIVE",
            language: "es",
            currency: "USD",
            timezone: "UTC",
        },
    });

    // =========================================================================
    // 2. TEMPLATES
    // =========================================================================
    console.log("📄 Creating default template...");

    const template = await prisma.template.create({
        data: {
            name: "Default Minimal",
            description: "A professional and clean template for medical and aesthetic clinics.",
            storagePath: "default",
            isPublic: true,
        }
    });

    // =========================================================================
    // 3. DEMO CLINIC COMPANY
    // =========================================================================
    console.log("🏢 Creating demo company: Clínica Aurora...");
    const company = await prisma.company.create({
        data: {
            name: "Clínica Aurora",
            legalName: "Aurora Estética S.A. de C.V.",
            slug: "clinica-aurora",
            status: "ACTIVE",
            language: "es",
            currency: "MXN",
            timezone: "America/Mexico_City",
            siteTemplateId: template.id,
        },
    });

    // =========================================================================
    // 4. USERS
    // =========================================================================
    console.log("👤 Creating user accounts...");

    const usersData = [
        { email: "superadmin@epikal.com", name: "Super Admin", role: "SUPERADMIN", companyId: systemCompany.id },
        { email: "admin@clinica-aurora.com", name: "Dra. Sofía Mendoza", role: "OWNER", companyId: company.id },
        { email: "pro1@clinica-aurora.com", name: "María Profesional", role: "STAFF", companyId: company.id },
        { email: "pro2@clinica-aurora.com", name: "Laura Profesional", role: "STAFF", companyId: company.id },
    ];

    for (const u of usersData) {
        await auth.api.signUpEmail({
            body: {
                email: u.email,
                password: "password123",
                name: u.name,
            }
        });

        const createdUser = await prisma.user.findUnique({ where: { email: u.email } });
        if (createdUser) {
            await prisma.user.update({
                where: { id: createdUser.id },
                data: { emailVerified: true }
            });

            await prisma.userCompany.create({
                data: {
                    userId: createdUser.id,
                    companyId: u.companyId,
                    role: u.role as any,
                    status: "ACTIVE",
                },
            });
            console.log(`   ✓ Created ${u.role}: ${u.name}`);
        }
    }

    // =========================================================================
    // 5. BRANDING
    // =========================================================================
    console.log("🎨 Setting up branding...");
    const branding = await prisma.companyBranding.create({
        data: {
            companyId: company.id,
            primaryColor: "#9333EA", // Indigo/Purple
            secondaryColor: "#F472B6", // Pink
            brandTone: "profesional",
            brandKeywords: ["belleza", "salud", "bienestar", "estética"],
            logoUrl: "/seed/aurora/logo.png",
        },
    });

    // =========================================================================
    // 6. LOCATIONS & RESOURCES
    // =========================================================================
    console.log("📍 Setting up infrastructure...");

    const location = await prisma.location.create({
        data: {
            companyId: company.id,
            name: "Sede Central Polanco",
            address: "Av. Masaryk 123",
            city: "CDMX",
            country: "México",
            phone: "+52 55 1234 5678",
            email: "polanco@clinica-aurora.com",
        },
    });

    const userPro1 = await prisma.user.findUnique({ where: { email: "pro1@clinica-aurora.com" } });
    const resource1 = await prisma.resource.create({
        data: {
            companyId: company.id,
            locationId: location.id,
            userId: userPro1?.id,
            type: "PROFESSIONAL",
            name: "María García",
            description: "Especialista en limpiezas y masajes.",
            status: "ACTIVE",
        }
    });

    const userPro2 = await prisma.user.findUnique({ where: { email: "pro2@clinica-aurora.com" } });
    const resource2 = await prisma.resource.create({
        data: {
            companyId: company.id,
            locationId: location.id,
            userId: userPro2?.id,
            type: "PROFESSIONAL",
            name: "Dra. Laura Torres",
            description: "Médico estético especializada en inyectables.",
            status: "ACTIVE",
        }
    });

    // =========================================================================
    // 7. SERVICES
    // =========================================================================
    console.log("💆‍♀️ Setting up services with rich content...");

    const services = [
        {
            name: "Limpieza Facial Profunda",
            slug: "facial-profundo",
            duration: 60,
            price: 850.00,
            shortDescription: "Purifica tu rostro con una técnica avanzada de extracción e hidratación profunda.",
            image: "/seed/aurora/services/limpieza-facial.jpeg",
            content: `
### Purificación y Renovación Cutánea

Nuestra **Limpieza Facial Profunda** es mucho más que un tratamiento cosmético; es un protocolo de salud para tu piel diseñado para eliminar impurezas acumuladas, células muertas y puntos negros.

#### ¿Qué incluye este protocolo?
*   **Análisis Cutáneo**: Evaluación inicial para determinar tu tipo de piel.
*   **Doble Limpieza**: Eliminación de residuos superficiales y maquillaje.
*   **Exfoliación Enzimática**: Preparación suave de la textura de la piel.
*   **Vapor con Ozono**: Apertura de poros para una extracción eficiente y bactericida.
*   **Extracción Manual Detallada**: Eliminación de comedones (puntos negros) con máxima higiene.
*   **Alta Frecuencia**: Cierre de poros y desinflamación.
*   **Hidratación y Masaje**: Aplicación de principios activos según tu necesidad.

Ideal para mantener una piel luminosa, libre de imperfecciones y retrasar los signos del envejecimiento.
`,
            faqs: [
                { question: "¿Es dolorosa la extracción?", answer: "Se percibe una ligera molestia momentánea, pero nuestras especialistas utilizan técnicas suaves para minimizar cualquier incomodidad." },
                { question: "¿Con qué frecuencia debo realizarla?", answer: "Recomendamos una limpieza profesional cada 28 a 35 días, que es el ciclo natural de renovación celular." }
            ],
            rIds: [resource1.id]
        },
        {
            name: "Masaje Relajante Holístico",
            slug: "masaje-relajante",
            duration: 50,
            price: 1200.00,
            shortDescription: "Libera tensiones musculares y equilibra tu mente con aceites esenciales orgánicos.",
            image: "/seed/aurora/services/masaje-relajante.jpeg",
            content: `
### Un Viaje de Serenidad para tus Sentidos

Sumérgete en un estado de relajación total con nuestro **Masaje Relajante Holístico**. Este tratamiento combina técnicas manuales rítmicas con la potencia terapéutica de la aromaterapia orgánica.

#### Beneficios inmediatos:
1.  **Reducción del Cortisol**: Disminuye los niveles de estrés de forma inmediata.
2.  **Alivio Muscular**: Suaviza contracturas leves causadas por malas posturas o fatiga.
3.  **Mejora de la Circulación**: Estimula el flujo sanguíneo y la oxigenación de los tejidos.
4.  **Paz Mental**: Un espacio de 50 minutos dedicado exclusivamente a tu bienestar interior.

Utilizamos **aceites esenciales de grado terapéutico** (lavanda, bergamota o eucalipto) que ayudan a armonizar tu sistema nervioso mientras cuidamos tu piel.
`,
            faqs: [
                { question: "¿Qué vestimenta debo usar?", answer: "Te proporcionaremos bata y ropa interior desechable para tu comodidad y privacidad durante el masaje." },
                { question: "¿Puedo elegir la intensidad?", answer: "Absolutamente. Al inicio de la sesión puedes indicarle al terapeuta si prefieres una presión suave, media o firme." }
            ],
            rIds: [resource1.id]
        },
        {
            name: "Bótox Preventivo (Baby Botox)",
            slug: "botox",
            duration: 30,
            price: 4500.00,
            shortDescription: "Suaviza las líneas de expresión y previene la formación de arrugas permanentes.",
            image: "/seed/aurora/services/botox.jpg",
            content: `
### Juventud Preservada con Naturalidad

El **Bótox Preventivo** es el tratamiento estándar de oro para quienes desean mantener una apariencia fresca y descansada sin perder la expresividad natural de su rostro.

#### ¿Cómo funciona?
Mediante micro-inyecciones de toxina botulínica de alta calidad (Botox® o Dysport®), relajamos suavemente los músculos responsables de las arrugas dinámicas en:
*   Frente
*   Entrecejo
*   "Patas de gallo" (contorno de ojos)

#### Resultados Esperados:
*   Piel visiblemente más lisa y tersa.
*   Prevención de surcos profundos en el futuro.
*   Efecto de "mirada descansada".

*Realizado exclusivamente por médicos estéticos certificados. Utilizamos productos con registro sanitario y trazabilidad garantizada.*
`,
            faqs: [
                { question: "¿Los resultados son inmediatos?", answer: "No, el efecto comienza a notarse entre el 3er y 5to día, alcanzando su punto máximo a los 15 días." },
                { question: "¿Qué cuidados debo tener después?", answer: "No recostarse en las 4 horas siguientes, no hacer ejercicio intenso por 24 horas y evitar la exposición al sol o calor extremo." }
            ],
            rIds: [resource2.id]
        },
        {
            name: "Radiofrecuencia Facial (Efecto Lifting)",
            slug: "radiofrecuencia",
            duration: 45,
            price: 1500.00,
            shortDescription: "Estimula el colágeno natural para tensar la piel y definir el contorno facial.",
            image: "/seed/aurora/services/radiofrecuencia-facial.webp",
            content: `
### Remodelación Facial sin Cirugía

La **Radiofrecuencia** es la tecnología líder para combatir la flacidez cutánea. Mediante ondas electromagnéticas que generan un calor controlado en las capas profundas de la dermis, logramos una contracción de las fibras de colágeno existentes y estimulamos la creación de nuevas.

#### El resultado es una piel más firme y rejuvenecida:
*   **Efecto Flash**: Tensión visible desde la primera sesión.
*   **Definición**: Ayuda a marcar el óvalo facial y reducir la papada.
*   **Textura**: Mejora la calidad general y el brillo de la piel.

Es un tratamiento indoloro, altamente placentero y que te permite retomar tus actividades sociales inmediatamente con un resplandor saludable.
`,
            faqs: [
                { question: "¿Cuántas sesiones se recomiendan?", answer: "Para resultados duraderos, sugerimos un protocolo de 6 sesiones realizadas cada 15 o 21 días." },
                { question: "¿Es apto para todo tipo de piel?", answer: "Sí, es un tratamiento seguro para todos los fototipos de piel y puede realizarse en cualquier época del año." }
            ],
            rIds: [resource1.id, resource2.id]
        },
        {
            name: "Depilación Láser Soprano Ice",
            slug: "depilacion-laser",
            duration: 40,
            price: 950.00,
            shortDescription: "Eliminación permanente del vello con tecnología de punta, rápida e indolora.",
            image: "/seed/aurora/services/depilacion-laser.jpg",
            content: `
### Despídete del Vello para Siempre

Experimenta la libertad de una piel suave todos los días con nuestra **Depilación Láser Soprano Ice**, la tecnología más premiada mundialmente por su eficacia y confort.

#### ¿Por qué elegir Soprano Ice?
*   **Prácticamente Indoloro**: Gracias a su sistema de enfriamiento integrado patentado.
*   **Eficaz en Veraneo**: Se puede aplicar incluso en pieles bronceadas.
*   **Sesiones Rápidas**: Protocolos optimizados para que tu tiempo sea valorado.
*   **Seguro y Preciso**: Tratamiento aprobado por la FDA y COFEPRIS.

#### Áreas Populares:
*   Axilas
*   Piernas completas
*   Área de Bikini / Brasilero
*   Espalda y Pecho

*Olvídate de la irritación del rastrillo o el dolor de la cera. Invierte en tu comodidad a largo plazo.*
`,
            faqs: [
                { question: "¿Cómo debo ir preparada?", answer: "El área debe estar rasurada con rastrillo preferiblemente 24 horas antes, sin cremas, desodorante ni maquillaje." },
                { question: "¿Cuántas sesiones necesito?", answer: "El promedio es de 8 a 10 sesiones, dependiendo de la zona, el tipo de vello y factores hormonales." }
            ],
            rIds: [resource1.id]
        }
    ];

    for (const s of services) {
        await prisma.service.create({
            data: {
                companyId: company.id,
                name: s.name,
                slug: s.slug,
                description: s.shortDescription,
                duration: s.duration,
                price: s.price,
                isPublic: true,
                webPage: {
                    create: {
                        displayTitle: s.name,
                        heroImage: s.image,
                        content: s.content.trim(),
                        faqs: s.faqs as any,
                    }
                },
                resources: {
                    create: s.rIds.map(rid => ({ resource: { connect: { id: rid } } }))
                }
            }
        });
    }

    // Standard availability (M-F, 9-18)
    const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
    for (const rId of [resource1.id, resource2.id]) {
        for (const day of days) {
            await prisma.availability.create({
                data: {
                    resourceId: rId,
                    dayOfWeek: day as any,
                    startTime: "09:00",
                    endTime: "18:00",
                    isAvailable: true
                }
            });
        }
    }

    // =========================================================================
    // 8. SITE SETTINGS (Landing Page Configuration)
    // =========================================================================
    console.log("🌐 Configuring landing page blocks...");

    await prisma.company.update({
        where: { id: company.id },
        data: {
            siteSettings: {
                contact: {
                    phone: "+52 55 1234 5678",
                    email: "hola@clinica-aurora.com",
                    address: "Av. Presidente Masaryk 123, Polanco"
                },
                pages: {
                    home: {
                        blocks: [
                            {
                                id: "hero-1",
                                type: "hero",
                                props: {
                                    title: "Bienvenida a Clínica Aurora",
                                    subtitle: "Tu santuario de belleza y cuidado personal en la CDMX. Descubre tratamientos diseñados para resaltar tu mejor versión.",
                                    ctaText: "Agendar Cita Ahora",
                                    ctaLink: "/booking",
                                    backgroundImage: "/seed/aurora/banner.png",
                                    alignment: "center"
                                }
                            },
                            {
                                id: "features-1",
                                type: "features",
                                props: {
                                    title: "¿Por qué confiar en nosotros?",
                                    description: "Nos apasiona brindarte resultados naturales respaldados por ciencia.",
                                    columns: 3,
                                    items: [
                                        { title: "Médicos Expertos", description: "Contamos con especialistas certificados con más de 10 años de experiencia.", icon: "fas fa-user-md" },
                                        { title: "Tecnología Premium", description: "Invertimos constantemente en aparatos de última generación mundial.", icon: "fas fa-star" },
                                        { title: "Atención HUMANA", description: "No eres un número más. Diseñamos planes personalizados para tu piel.", icon: "fas fa-heart" }
                                    ]
                                }
                            },
                            {
                                id: "services-1",
                                type: "services",
                                props: {
                                    title: "Nuestros Tratamientos Destacados",
                                    showPrice: true,
                                    showDescription: true
                                }
                            },
                            {
                                id: "testimonials-1",
                                type: "testimonials",
                                props: {
                                    title: "Testimonios de Pacientes",
                                    items: [
                                        { text: "La Dra. Sofía tiene unas manos mágicas. El Bótox se ve súper natural, justo lo que buscaba.", author: "Andrea Gómez", role: "Paciente Frecuente" },
                                        { text: "El mejor facial que me han hecho en años. El personal es muy amable.", author: "Ricardo Silva", role: "Cliente Premium" }
                                    ]
                                }
                            },
                            {
                                id: "contact-1",
                                type: "contact",
                                props: {
                                    title: "Visítanos en Polanco",
                                    subtitle: "Envíanos un mensaje o agenda directamente desde el botón superior."
                                }
                            }
                        ]
                    },
                    "service-detail": {
                        blocks: [
                            {
                                id: "s-hero",
                                type: "hero",
                                props: {
                                    title: "${service.name}",
                                    subtitle: "Tratamiento especializado de ${service.duration} minutos por $${service.price}",
                                    ctaText: "Reservar este servicio",
                                    ctaLink: "/booking?serviceId=${service.id}",
                                    backgroundImage: "${service.image}",
                                    alignment: "left"
                                }
                            },
                            {
                                id: "s-content",
                                type: "content",
                                props: {
                                    title: "Sobre el tratamiento",
                                    content: "${service.longDescription}",
                                    alignment: "left"
                                }
                            },
                            {
                                id: "s-faq",
                                type: "faq",
                                props: {
                                    title: "Preguntas Frecuentes",
                                    items: "${service.faqs}"
                                }
                            }
                        ]
                    }
                }
            } as any
        }
    });

    // =========================================================================
    // 9. REMINDERS & NOTIFICATIONS
    // =========================================================================
    console.log("⏰ Configuring reminders...");
    await prisma.reminderConfig.createMany({
        data: [
            {
                companyId: company.id,
                channel: "EMAIL",
                timeValue: 1,
                timeUnit: "DAYS",
                isActive: true
            },
            {
                companyId: company.id,
                channel: "EMAIL",
                timeValue: 2,
                timeUnit: "HOURS",
                isActive: true
            }
        ]
    });

    // =========================================================================
    // 10. DUMMY CUSTOMERS & BOOKINGS
    // =========================================================================
    console.log("📅 Generating random bookings...");

    const dummyCustomers = [
        { name: "Ana P.", email: "ana.customer@example.com" },
        { name: "Carlos M.", email: "carlos.customer@example.com" },
        { name: "Lucía R.", email: "lucia.customer@example.com" },
        { name: "Miguel T.", email: "miguel.customer@example.com" },
        { name: "Sofia L.", email: "sofia.customer@example.com" }
    ];

    const createdCustomers = [];
    for (const c of dummyCustomers) {
        const cust = await prisma.customer.create({
            data: {
                companyId: company.id,
                firstName: c.name.split(" ")[0],
                lastName: c.name.split(" ")[1],
                email: c.email,
                totalBookings: 0
            }
        });
        createdCustomers.push(cust);
    }

    const statuses = ["CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW", "PENDING"];
    const now = new Date();
    const serviceIds = await prisma.service.findMany({ where: { companyId: company.id } });
    const resources = [resource1, resource2];

    // Generate ~20 bookings
    for (let i = 0; i < 20; i++) {
        // Random Day: -7 to +7 days
        const dayOffset = Math.floor(Math.random() * 15) - 7;
        const dateBase = addDays(now, dayOffset);

        // Random Hour: 9 to 17
        const hour = Math.floor(Math.random() * 9) + 9;
        const startTime = setHours(startOfHour(dateBase), hour);

        // Random Service
        const service = serviceIds[Math.floor(Math.random() * serviceIds.length)];
        // Resolve Service duration to set endTime
        // (We need to fetch service details or assume stored in array above, better to fetch)
        // Optimization: We fetched IDs above, let's just pick one and fetch full or careful matching.
        // Actually serviceIds contains the objects if we didn't use select. prisma.service.findMany() returns objects.
        const duration = service.duration;
        const endTime = new Date(startTime.getTime() + duration * 60000);

        // Random Resource (linked to service ideally, but for seed we can be loose or check)
        // resource1 does basic stuff, resource2 does medical.
        // Let's just pick random for simplicity of seed unless strict check needed.
        // Prisma schema allows any resource if no strict validation in seed.
        const resource = resources[Math.floor(Math.random() * resources.length)];

        // Random Customer
        const customer = createdCustomers[Math.floor(Math.random() * createdCustomers.length)];

        // Random Status
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        await prisma.booking.create({
            data: {
                companyId: company.id,
                serviceId: service.id,
                resourceId: resource.id,
                customerId: customer.id,
                customerName: customer.firstName + " " + (customer.lastName || ""),
                customerEmail: customer.email,
                startTime: startTime,
                endTime: endTime,
                status: status as any,
                rescheduleToken: randomUUID(),
                cancellationToken: randomUUID(),
                confirmationToken: status === "PENDING" ? randomUUID() : null
            }
        });
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Rich Seed completed successfully!");
    console.log("🔑 Initialized: 1 Template, 5 Services, 1 Clinic, 4 Users.");
    console.log("=".repeat(60) + "\n");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
