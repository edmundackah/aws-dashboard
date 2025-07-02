// app/data/schema.ts
import {z} from "zod";

// Schema for SPA data
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
});

// Schema for Microservice data
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
});

// New schema for the Team Stats table
export const teamStatSchema = z.object({
  teamName: z.string(),
  spaCount: z.number(),
  msCount: z.number(),
});

export type Spa = z.infer<typeof spaSchema>;
export type Microservice = z.infer<typeof msSchema>;
export type TeamStat = z.infer<typeof teamStatSchema>;