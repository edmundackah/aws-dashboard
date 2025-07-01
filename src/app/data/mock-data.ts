// app/data/mock-data.ts
import { Spa, Microservice } from "./schema";

export const mockSpaData: Spa[] = [
  { projectName: "Phoenix UI", homepage: "https://example.com/phoenix", subgroupName: "Team Apollo", environments: { dev: true, sit: true, uat: true, nft: false }, projectLink: "https://git.example.com/phoenix-ui" },
  { projectName: "Orion Checkout", homepage: "https://example.com/orion", subgroupName: "Team Zeus", environments: { dev: true, sit: true, uat: false, nft: false }, projectLink: "https://git.example.com/orion-checkout" },
  { projectName: "Pegasus Dashboard", homepage: "https://example.com/pegasus", subgroupName: "Team Apollo", environments: { dev: true, sit: true, uat: true, nft: true }, projectLink: "https://git.example.com/pegasus-dash" },
  { projectName: "Gemini Forms", homepage: "https://example.com/gemini", subgroupName: "Team Hercules", environments: { dev: true, sit: false, uat: false, nft: false }, projectLink: "https://git.example.com/gemini-forms" },
  { projectName: "Vega Analytics", homepage: "https://example.com/vega", subgroupName: "Team Zeus", environments: { dev: true, sit: true, uat: true, nft: false }, projectLink: "https://git.example.com/vega-analytics" },
];

export const mockMsData: Microservice[] = [
  // OTel now includes version numbers or "No"
  { projectName: "Auth Service", subgroupName: "Team Hercules", otel: "v1.2.0", mssdk: "v2.1", environments: { dev: true, sit: true, uat: true, nft: true }, projectLink: "https://git.example.com/auth-service" },
  { projectName: "Payment Gateway", subgroupName: "Team Zeus", otel: "v1.3.1", mssdk: "v2.1", environments: { dev: true, sit: true, uat: false, nft: false }, projectLink: "https://git.example.com/payment-gateway" },
  { projectName: "Notification Hub", subgroupName: "Team Apollo", otel: "No", mssdk: "v1.8", environments: { dev: true, sit: false, uat: false, nft: false }, projectLink: "https://git.example.com/notification-hub" },
  { projectName: "Inventory Manager", subgroupName: "Team Hercules", otel: "v1.2.5", mssdk: "v2.2", environments: { dev: true, sit: true, uat: true, nft: false }, projectLink: "https://git.example.com/inventory" },
  { projectName: "User Profile API", subgroupName: "Team Zeus", otel: "No", mssdk: "v2.0", environments: { dev: true, sit: true, uat: true, nft: true }, projectLink: "https://git.example.com/user-profile" },
];

export const lastUpdateTimestamp = new Date().toISOString();