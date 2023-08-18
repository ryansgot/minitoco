
const prisma = new PrismaClient()
async function main() {
  // const stored_connections: Array<Connection> = await Promise.all();
  // console.table(stored_connections);
}
main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })