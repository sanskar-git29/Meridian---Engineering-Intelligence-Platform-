// import { prisma } from "../config/prisma.confi.js"
// import { withTenant } from "../lib/withTenant.js";

// async function test() {
//   try {
//     const result = await prisma.$queryRaw<
//       { current_user: string }[]
//     >`
//       SELECT current_user
//     `;

//     console.log("DATABASE USER:");
//     console.log(result);

//     const memberships = await withTenant(
//       "org-b",
//       async (tx) => {
//         return tx.membership.findMany();
//       }
//     );

//     console.log("ORG A MEMBERSHIPS:");
//     console.log(memberships);
//   } catch (error) {
//     console.error(error);
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// test();

import { Router } from "express";
import { withTenant } from "../lib/withTenant.js";
import  authenticate  from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/memberships",
  authenticate,
  async (req, res) => {
    try {
      const organizationId = req.user.organizationId ;

      const memberships = await withTenant(
        organizationId,
        async (tx) => {
          return tx.membership.findMany();
        }
      );

      res.json(memberships);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to fetch memberships",
      });
    }
  }
);

export default router;