import { z } from "zod";

export const profileUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Invalid email address"),
  image: z.string().url("Invalid image URL").optional().or(z.literal("")),
});

