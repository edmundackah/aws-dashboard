import { z } from "zod";

// Add an optional 'status' field
export const spaSchema = z.object({
  projectName: z.string(),
  homepage: z.string().url(),
  subgroupName: z.string(),
  environments: z.object({
    dev: z.boolean(),
    sit: z.boolean(),
    uat: z.boolean(),
    nft: z.boolean(),
  }),
  projectLink: z.string().url(),
  status: z.string().optional(),
});

// Add an optional 'status' field
export const msSchema = z.object({
  projectName: z.string(),
  subgroupName: z.string(),
  otel: z.string(),
  mssdk: z.string(),
  environments: z.object({
    dev: z.boolean(),
    sit: z.boolean(),
    uat: z.boolean(),
    nft: z.boolean(),
  }),
  projectLink: z.string().url(),
  status: z.string().optional(),
});

// Update the TeamStat schema with new columns
export const teamStatSchema = z.object({
  teamName: z.string(),
  migratedSpaCount: z.number(),
  outstandingSpaCount: z.number(),
  migratedMsCount: z.number(),
  outstandingMsCount: z.number(),
});

export type Spa = z.infer<typeof spaSchema>;
export type Microservice = z.infer<typeof msSchema>;
export type TeamStat = z.infer<typeof teamStatSchema>;