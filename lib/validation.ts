import { z } from "zod";
const short = z.string().trim().max(150).default("");
export const submission = z.object({
  token: z.string().uuid(),
  profile: z.object({
    firstName: z.string().trim().min(2).max(60),
    lastName: z.string().trim().min(2).max(80),
    phone: z
      .string()
      .trim()
      .max(20)
      .regex(/^(?:\+?[0-9۰-۹٠-٩][0-9۰-۹٠-٩ ()-]{6,19})?$/),
    position: short,
    organization: short,
    education: z.enum(["", "کارشناسی", "کارشناسی ارشد", "دکتری تخصصی"]),
    field: short,
    experience: z
      .string()
      .max(2)
      .regex(/^[0-9۰-۹٠-٩]{0,2}$/),
    expertise: z.array(z.string().max(60)).max(7),
    otherExpertise: short,
  }),
  answers: z.array(z.number().int().min(0).max(4)).length(56),
  notes: z.string().trim().max(3000).default(""),
});
