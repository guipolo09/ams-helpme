import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const org = await prisma.organization.upsert({
    where: { slug: "demo" },
    update: {},
    create: { name: "Empresa Demo", slug: "demo" },
  });

  const passwordHash = await bcrypt.hash("senha123", 10);

  const admin = await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: "admin@demo.com" } },
    update: { passwordHash },
    create: {
      organizationId: org.id,
      name: "Ana Admin",
      email: "admin@demo.com",
      passwordHash,
      role: "ADMIN",
      jobTitle: "Gestora de TI",
    },
  });

  const agent = await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: "agente@demo.com" } },
    update: { passwordHash },
    create: {
      organizationId: org.id,
      name: "Carlos Atendente",
      email: "agente@demo.com",
      passwordHash,
      role: "AGENT",
      specialties: ["Infraestrutura", "Sistemas internos"],
    },
  });

  const requester = await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: "solicitante@demo.com" } },
    update: { passwordHash },
    create: {
      organizationId: org.id,
      name: "Bruna Solicitante",
      email: "solicitante@demo.com",
      passwordHash,
      role: "REQUESTER",
      department: "Financeiro",
    },
  });

  const appErp = await prisma.application.upsert({
    where: { id: "seed-app-erp" },
    update: {},
    create: {
      id: "seed-app-erp",
      organizationId: org.id,
      name: "ERP Financeiro",
      description: "Sistema de gestão financeira e contábil",
      ownerName: "Equipe Financeiro",
    },
  });

  await prisma.application.upsert({
    where: { id: "seed-app-portal" },
    update: {},
    create: {
      id: "seed-app-portal",
      organizationId: org.id,
      name: "Portal do Cliente",
      description: "Portal web de autoatendimento",
      ownerName: "Equipe Web",
    },
  });

  const catBug = await prisma.category.upsert({
    where: { organizationId_name: { organizationId: org.id, name: "Erro / Bug" } },
    update: {},
    create: { organizationId: org.id, name: "Erro / Bug", color: "#E24B4A" },
  });

  await prisma.category.upsert({
    where: { organizationId_name: { organizationId: org.id, name: "Dúvida" } },
    update: {},
    create: { organizationId: org.id, name: "Dúvida", color: "#378ADD" },
  });

  await prisma.category.upsert({
    where: { organizationId_name: { organizationId: org.id, name: "Solicitação" } },
    update: {},
    create: { organizationId: org.id, name: "Solicitação", color: "#1D9E75" },
  });

  const existingTicket = await prisma.ticket.findFirst({
    where: { organizationId: org.id, number: 1 },
  });

  if (!existingTicket) {
    await prisma.ticket.create({
      data: {
        organizationId: org.id,
        number: 1,
        title: "Erro ao gerar relatório financeiro",
        description:
          "Ao tentar exportar o relatório mensal em PDF, o sistema retorna erro 500.",
        status: "ABERTO",
        priority: "ALTA",
        applicationId: appErp.id,
        categoryId: catBug.id,
        requesterId: requester.id,
        statusHistory: {
          create: { changedById: requester.id, toStatus: "ABERTO", note: "Chamado aberto" },
        },
        comments: {
          create: {
            authorId: requester.id,
            body: "Segue o passo a passo: menu Relatórios > Mensal > Exportar PDF.",
          },
        },
      },
    });
  }

  console.log("Seed concluído:");
  console.log("  Organização:", org.name);
  console.log("  Admin:       admin@demo.com / senha123");
  console.log("  Atendente:   agente@demo.com / senha123 (", agent.name, ")");
  console.log("  Solicitante: solicitante@demo.com / senha123");
  console.log("  Admin id:", admin.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
