import {z} from "zod";

export const spaSchema = z.object({
  projectName: z.string(),
  homepage: z.string().url(),
  subgroupName: z.string(),
  projectLink: z.string().url(),
  status: z.enum(["MIGRATED", "NOT_MIGRATED"]).default("NOT_MIGRATED"),
  environments: z
    .object({
      dev: z.boolean().optional().default(false),
      sit: z.boolean().optional().default(false),
      uat: z.boolean().optional().default(false),
      nft: z.boolean().optional().default(false),
    })
    .optional()
    .default({}),
  lastUpdate: z.string().optional(),
  technicalSme: z
    .object({
      name: z.string(),
      email: z.string().email(),
    })
    .optional(),
});

export const msSchema = z.object({
  projectName: z.string(),
  subgroupName: z.string(),
  otel: z
    .union([
      z.object({
        traces: z.boolean().optional().default(false),
        metrics: z.boolean().optional().default(false),
        logs: z.boolean().optional().default(false),
      }),
      z.string(),
    ])
    .optional()
    .default({}),
  mssdk: z
    .union([
      z.object({
        "nodejs-express": z.boolean().optional().default(false),
        "java-spring-boot": z.boolean().optional().default(false),
        "python-fastapi": z.boolean().optional().default(false),
        "go-chi": z.boolean().optional().default(false),
        "nodejs-nextjs": z.boolean().optional().default(false),
      }),
      z.string(),
    ])
    .optional()
    .default({}),
  environments: z
    .object({
      dev: z.boolean().optional().default(false),
      sit: z.boolean().optional().default(false),
      uat: z.boolean().optional().default(false),
      nft: z.boolean().optional().default(false),
    })
    .optional()
    .default({}),
  projectLink: z.string().url(),
  status: z.enum(["MIGRATED", "NOT_MIGRATED"]).default("NOT_MIGRATED"),
  lastUpdate: z.string().optional(),
  technicalSme: z
    .object({
      name: z.string(),
      email: z.string().email(),
    })
    .optional(),
});

// Update the TeamStat schema with new columns
export const teamStatSchema = z.object({
  teamName: z.string(),
  migratedSpaCount: z.number(),
  outstandingSpaCount: z.number(),
  migratedMsCount: z.number(),
  outstandingMsCount: z.number(),
  technicalSme: z
    .object({
      name: z.string(),
      email: z.string().email(),
    })
    .optional(),
});

export type Spa = z.infer<typeof spaSchema>;
export type Microservice = z.infer<typeof msSchema>;
export type TeamStat = z.infer<typeof teamStatSchema>;