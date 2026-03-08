node -e '
const { PrismaClient } = require("@prisma/client");
const { randomUUID, randomBytes, scrypt } = require("crypto");
const { promisify } = require("util");
const scryptAsync = promisify(scrypt);

(async () => {
  const prisma = new PrismaClient();

  const username = "user".trim().toLowerCase();
  const password = "password";

  const salt = randomBytes(16).toString("hex");
  const hash = await scryptAsync(password, salt, 64);
  const passwordHash = `${salt}:${hash.toString("hex")}`;

  await prisma.user.create({
    data: { id: randomUUID(), username, passwordHash }
  });

  console.log("Created user:", username);
  await prisma.$disconnect();
})();
'
