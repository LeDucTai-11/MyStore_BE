import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    await prisma.role.createMany({
        data: [
            { name: "User" },
            { name: "Cashier" },
            { name: "Admin" },
            { name: "Shipper" }
        ],
        skipDuplicates: true,
    });

    await prisma.requestStatus.createMany({
        data: [
            { name: "Pending" },
            { name: "Approved" },
            { name: "Rejected" }
        ],
        skipDuplicates: true,
    });

    await prisma.orderStatus.createMany({
        data: [
            {name:'PENDING_CONFIRM'},
            {name: "CONFIRMED"},
            {name: 'PENDING_PAYMENT'},
            {name: 'PAYMENT_CONFIRMED'},
            {name: 'DELIVERING'},
            {name: 'COMPLETED'},
            {name: 'CANCELED'}
        ]
    })
}

main()
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });