// Swagger 2.0 Types
export interface SwaggerSpec {
  swagger: '2.0'
  info: SwaggerInfo
  host?: string
  basePath?: string
  schemes?: string[]
  consumes?: string[]
  produces?: string[]
  paths: Record<string, PathItem>
  definitions?: Record<string, Schema>
  parameters?: Record<string, Parameter>
  responses?: Record<string, Response>
  securityDefinitions?: Record<string, SecurityScheme>
  security?: SecurityRequirement[]
  tags?: Tag[]
  externalDocs?: ExternalDocs
}

// OpenAPI 3.x Types
export interface OpenAPISpec {
  openapi: string
  info: OpenAPIInfo
  servers?: Server[]
  paths: Record<string, PathItem>
  components?: Components
  security?: SecurityRequirement[]
  tags?: Tag[]
  externalDocs?: ExternalDocs
}

export interface SwaggerInfo {
  title: string
  description?: string
  termsOfService?: string
  contact?: Contact
  license?: License
  version: string
}

export interface OpenAPIInfo extends SwaggerInfo {
  summary?: string
}

export interface Contact {
  name?: string
  url?: string
  email?: string
}

export interface License {
  name: string
  url?: string
}

export interface Server {
  url: string
  description?: string
  variables?: Record<string, ServerVariable>
}

export interface ServerVariable {
  enum?: string[]
  default: string
  description?: string
}

export interface Tag {
  name: string
  description?: string
  externalDocs?: ExternalDocs
}

export interface ExternalDocs {
  description?: string
  url: string
}

export interface PathItem {
  $ref?: string
  summary?: string
  description?: string
  get?: Operation
  put?: Operation
  post?: Operation
  delete?: Operation
  options?: Operation
  head?: Operation
  patch?: Operation
  trace?: Operation
  servers?: Server[]
  parameters?: Array<Parameter | Reference>
}

export interface Operation {
  tags?: string[]
  summary?: string
  description?: string
  externalDocs?: ExternalDocs
  operationId?: string
  consumes?: string[]
  produces?: string[]
  parameters?: Array<Parameter | Reference>
  requestBody?: RequestBody | Reference
  responses: Record<string, Response | Reference>
  callbacks?: Record<string, Callback | Reference>
  deprecated?: boolean
  security?: SecurityRequirement[]
  servers?: Server[]
}

export interface Parameter {
  name: string
  in: 'query' | 'header' | 'path' | 'formData' | 'body'
  description?: string
  required?: boolean
  deprecated?: boolean
  allowEmptyValue?: boolean
  style?: string
  explode?: boolean
  allowReserved?: boolean
  schema?: Schema | Reference
  example?: unknown
  examples?: Record<string, Example | Reference>
  content?: Record<string, MediaType>
  // Swagger 2.0 specific
  type?: string
  format?: string
  items?: Schema
  collectionFormat?: string
  default?: unknown
  maximum?: number
  exclusiveMaximum?: boolean
  minimum?: number
  exclusiveMinimum?: boolean
  maxLength?: number
  minLength?: number
  pattern?: string
  maxItems?: number
  minItems?: number
  uniqueItems?: boolean
  enum?: unknown[]
  multipleOf?: number
}

export interface RequestBody {
  description?: string
  content: Record<string, MediaType>
  required?: boolean
}

export interface MediaType {
  schema?: Schema | Reference
  example?: unknown
  examples?: Record<string, Example | Reference>
  encoding?: Record<string, Encoding>
}

export interface Encoding {
  contentType?: string
  headers?: Record<string, Header | Reference>
  style?: string
  explode?: boolean
  allowReserved?: boolean
}

export interface Response {
  description: string
  headers?: Record<string, Header | Reference>
  content?: Record<string, MediaType>
  links?: Record<string, Link | Reference>
  // Swagger 2.0 specific
  schema?: Schema | Reference
  examples?: Record<string, unknown>
}

export interface Callback {
  [expression: string]: PathItem | Reference
}

export interface Example {
  summary?: string
  description?: string
  value?: unknown
  externalValue?: string
}

export interface Link {
  operationRef?: string
  operationId?: string
  parameters?: Record<string, unknown>
  requestBody?: unknown
  description?: string
  server?: Server
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Header extends Omit<Parameter, 'name' | 'in'> {}

export interface Schema {
  title?: string
  multipleOf?: number
  maximum?: number
  exclusiveMaximum?: boolean | number
  minimum?: number
  exclusiveMinimum?: boolean | number
  maxLength?: number
  minLength?: number
  pattern?: string
  maxItems?: number
  minItems?: number
  uniqueItems?: boolean
  maxProperties?: number
  minProperties?: number
  required?: string[]
  enum?: unknown[]
  type?: string
  allOf?: Array<Schema | Reference>
  oneOf?: Array<Schema | Reference>
  anyOf?: Array<Schema | Reference>
  not?: Schema | Reference
  items?: Schema | Reference
  properties?: Record<string, Schema | Reference>
  additionalProperties?: boolean | Schema | Reference
  description?: string
  format?: string
  default?: unknown
  nullable?: boolean
  discriminator?: Discriminator
  readOnly?: boolean
  writeOnly?: boolean
  xml?: XML
  externalDocs?: ExternalDocs
  example?: unknown
  deprecated?: boolean
  // Swagger 2.0 specific
  $ref?: string
}

export interface Discriminator {
  propertyName: string
  mapping?: Record<string, string>
}

export interface XML {
  name?: string
  namespace?: string
  prefix?: string
  attribute?: boolean
  wrapped?: boolean
}

export interface SecurityScheme {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect'
  description?: string
  name?: string
  in?: 'query' | 'header' | 'cookie'
  scheme?: string
  bearerFormat?: string
  flows?: OAuthFlows
  openIdConnectUrl?: string
  // Swagger 2.0 specific
  flow?: string
  authorizationUrl?: string
  tokenUrl?: string
  scopes?: Record<string, string>
}

export interface OAuthFlows {
  implicit?: OAuthFlow
  password?: OAuthFlow
  clientCredentials?: OAuthFlow
  authorizationCode?: OAuthFlow
}

export interface OAuthFlow {
  authorizationUrl?: string
  tokenUrl?: string
  refreshUrl?: string
  scopes: Record<string, string>
}

export interface SecurityRequirement {
  [securityScheme: string]: string[]
}

export interface Components {
  schemas?: Record<string, Schema | Reference>
  responses?: Record<string, Response | Reference>
  parameters?: Record<string, Parameter | Reference>
  examples?: Record<string, Example | Reference>
  requestBodies?: Record<string, RequestBody | Reference>
  headers?: Record<string, Header | Reference>
  securitySchemes?: Record<string, SecurityScheme | Reference>
  links?: Record<string, Link | Reference>
  callbacks?: Record<string, Callback | Reference>
}

export interface Reference {
  $ref: string
}

// Type guards
export function isSwagger2(spec: unknown): spec is SwaggerSpec {
  return spec !== null && typeof spec === 'object' && 'swagger' in spec && spec.swagger === '2.0'
}

export function isOpenAPI3(spec: unknown): spec is OpenAPISpec {
  return spec !== null && typeof spec === 'object' && 'openapi' in spec && typeof spec.openapi === 'string' && spec.openapi.startsWith('3.')
}

export function isReference(obj: unknown): obj is Reference {
  return obj !== null && typeof obj === 'object' && '$ref' in obj && typeof obj.$ref === 'string'
}

// Helper to resolve references
export function resolveReference(ref: string, spec: SwaggerSpec | OpenAPISpec): unknown {
  const parts = ref.split('/')
  if (parts[0] !== '#') {
    throw new Error('Only local references are supported')
  }
  
  let current: unknown = spec
  for (let i = 1; i < parts.length; i++) {
    if (current && typeof current === 'object' && parts[i] in current) {
      current = (current as Record<string, unknown>)[parts[i]]
    } else {
      throw new Error(`Reference ${ref} not found`)
    }
  }
  
  return current
}
