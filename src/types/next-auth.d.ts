import type { DefaultSession } from "next-auth";
import type { Role } from "@/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      /** Set only when role is CONTRIBUTOR -- the linked Professional record. */
      professionalId?: string;
    } & DefaultSession["user"];
  }
}
