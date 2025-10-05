'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Play, Copy, Check, Upload, Lock, Unlock, AlertCircle, Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  SwaggerSpec,
  OpenAPISpec,
  Operation,
  Parameter,
  RequestBody,
  Response,
  Schema,
  SecurityScheme,
  isSwagger2,
  resolveReference,
  isReference
} from '@/lib/swagger-types'
import SwaggerSchema from './swagger-schema'
import CodeBlock from './json-code-block'
import { toast } from 'sonner'
import type { AuthCredential } from './auth-modal'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface SwaggerEndpointProps {
  path: string
  method: string
  operation: Operation
  spec: SwaggerSpec | OpenAPISpec
  authCredentials?: Record<string, AuthCredential>
  selectedServer?: string | null
}

const methodColors = {
  get: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  post: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  put: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  delete: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  patch: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  options: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  head: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
}

export default function SwaggerEndpoint({ path, method, operation, spec, authCredentials = {}, selectedServer }: SwaggerEndpointProps) {
  const [expanded, setExpanded] = useState(false)
  const [tryItOut, setTryItOut] = useState(false)
  const [paramValues, setParamValues] = useState<Record<string, string | number | boolean | File>>({})
  const [arrayParamValues, setArrayParamValues] = useState<Record<string, (string | number | boolean)[]>>({})
  const [bodyValue, setBodyValue] = useState('')
  const [localAuth, setLocalAuth] = useState<Record<string, AuthCredential>>({})
  const [useLocalAuth, setUseLocalAuth] = useState(false)
  const [response, setResponse] = useState<{
    status?: number
    statusText?: string
    headers?: Record<string, string>
    data?: unknown
    duration?: number
    error?: string
    contentType?: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [curlCommand, setCurlCommand] = useState<string>('')
  const [requestUrl, setRequestUrl] = useState<string>('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [responseViewMode, setResponseViewMode] = useState<Record<string, 'schema' | 'example'>>({})
  const [requestBodyViewMode, setRequestBodyViewMode] = useState<'schema' | 'example'>('example')
  const [selectedResponseContentType, setSelectedResponseContentType] = useState<Record<string, string>>({})
  const [selectedRequestBodyContentType, setSelectedRequestBodyContentType] = useState<string>('')
  
  const toggleResponseView = (status: string) => {
    setResponseViewMode(prev => ({
      ...prev,
      [status]: prev[status] === 'example' ? 'schema' : 'example'
    }))
  }
  
  // Get default view mode for a response (defaults to 'example')
  const getResponseViewMode = (status: string): 'schema' | 'example' => {
    return responseViewMode[status] !== undefined ? responseViewMode[status] : 'example'
  }

  // Get selected content type for a response status
  const getSelectedContentType = (status: string, contentTypes: string[]): string => {
    if (selectedResponseContentType[status]) {
      return selectedResponseContentType[status]
    }
    // Default to first content type (usually application/json)
    return contentTypes[0] || 'application/json'
  }

  // Set selected content type for a response status
  const setResponseContentType = (status: string, contentType: string) => {
    setSelectedResponseContentType(prev => ({
      ...prev,
      [status]: contentType
    }))
  }

  // Update body value when content type changes
  const updateBodyValueForContentType = (newContentType: string) => {
    setSelectedRequestBodyContentType(newContentType)
    
    // Always regenerate the example for the new content type
    const bodySchemaData = getRequestBodySchema()
    const bodyParam = getBodyParameter()
    
    // Use OpenAPI 3.x schema if available, otherwise use Swagger 2.0 body parameter schema
    const schema = bodySchemaData?.schema || bodyParam?.schema
    
    if (schema) {
      const newExample = generateExample(schema, newContentType)
      setBodyValue(newExample)
    }
  }

  const toggleRequestBodyView = () => {
    setRequestBodyViewMode(prev => prev === 'example' ? 'schema' : 'example')
  }

  // Format XML with proper indentation
  const formatXml = (xml: string): string => {
    try {
      // Simple XML pretty formatting using regex
      let formatted = xml
        .replace(/></g, '>\n<')  // Add newlines between tags
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
      
      // Add proper indentation
      let indentLevel = 0
      const indented = formatted.map(line => {
        if (line.startsWith('</')) {
          indentLevel = Math.max(0, indentLevel - 1)
        }
        
        const indentedLine = '  '.repeat(indentLevel) + line
        
        if (line.startsWith('<') && !line.startsWith('</') && !line.endsWith('/>')) {
          indentLevel++
        }
        
        return indentedLine
      })
      
      return indented.join('\n')
    } catch {
      // If formatting fails, return original XML
      return xml
    }
  }
  
  const generateExample = (schema: unknown, contentType?: string): string => {
    const resolvedSchema = isReference(schema) 
      ? resolveReference((schema as { $ref: string }).$ref, spec) as Schema
      : schema as Schema
    
    if (resolvedSchema.example !== undefined) {
      return contentType?.includes('xml') 
        ? convertToXml(resolvedSchema.example)
        : JSON.stringify(resolvedSchema.example, null, 2)
    }
    
    // Helper function to generate a single example value
    const generateExampleValue = (propSchema: Schema): unknown => {
      if (propSchema.example !== undefined) {
        return propSchema.example
      }
      if (propSchema.default !== undefined) {
        return propSchema.default
      }
      
      switch (propSchema.type) {
        case 'string':
          return propSchema.enum ? propSchema.enum[0] : 'string'
        case 'integer':
        case 'number':
          return 0
        case 'boolean':
          return true
        case 'array':
          // Recursively generate array items
          if (propSchema.items) {
            const itemSchema = isReference(propSchema.items)
              ? resolveReference(propSchema.items.$ref, spec) as Schema
              : propSchema.items as Schema
            return [generateExampleValue(itemSchema)]
          }
          return []
        case 'object':
          // Recursively generate object properties
          if (propSchema.properties) {
            const obj: Record<string, unknown> = {}
            Object.entries(propSchema.properties).forEach(([k, v]) => {
              const vSchema = isReference(v)
                ? resolveReference(v.$ref, spec) as Schema
                : v as Schema
              obj[k] = generateExampleValue(vSchema)
            })
            return obj
          }
          return {}
        default:
          return null
      }
    }
    
    // Generate example based on type
        if (resolvedSchema.type === 'object' && resolvedSchema.properties) {
          const example: Record<string, unknown> = {}
          Object.entries(resolvedSchema.properties).forEach(([key, prop]) => {
            const propSchema = isReference(prop) 
              ? resolveReference(prop.$ref, spec) as Schema
              : prop as Schema
            
            example[key] = generateExampleValue(propSchema)
          })
          
          if (contentType?.includes('xml')) {
            // Use the schema name or default to the operation name
            const rootElementName = resolvedSchema.xml?.name || 'Pet'
            const xmlContent = convertToXml(example, rootElementName)
            return `<?xml version="1.0" encoding="UTF-8"?>\n${xmlContent}`
          }
          
          return JSON.stringify(example, null, 2)
        }
    
        if (resolvedSchema.type === 'array') {
          // Generate example array with one item
          if (resolvedSchema.items) {
            const itemSchema = isReference(resolvedSchema.items)
              ? resolveReference(resolvedSchema.items.$ref, spec) as Schema
              : resolvedSchema.items as Schema
            const exampleItem = generateExampleValue(itemSchema)
            const example = [exampleItem]
            
            if (contentType?.includes('xml')) {
              const rootElementName = resolvedSchema.xml?.name || 'array'
              const xmlContent = convertToXml(example, rootElementName)
              return `<?xml version="1.0" encoding="UTF-8"?>\n${xmlContent}`
            }
            
            return JSON.stringify(example, null, 2)
          }
          return contentType?.includes('xml') ? '<?xml version="1.0" encoding="UTF-8"?>\n<array></array>' : '[]'
        }
    
        if (resolvedSchema.type === 'string') {
          return contentType?.includes('xml') 
            ? '<?xml version="1.0" encoding="UTF-8"?>\n<string>string</string>'
            : JSON.stringify('string', null, 2)
        }
        
        if (resolvedSchema.type === 'integer' || resolvedSchema.type === 'number') {
          return contentType?.includes('xml') 
            ? '<?xml version="1.0" encoding="UTF-8"?>\n<number>0</number>'
            : JSON.stringify(0, null, 2)
        }
        
        if (resolvedSchema.type === 'boolean') {
          return contentType?.includes('xml') 
            ? '<?xml version="1.0" encoding="UTF-8"?>\n<boolean>true</boolean>'
            : JSON.stringify(true, null, 2)
        }
        
        // Default to empty object for unknown types
        return contentType?.includes('xml') 
          ? '<?xml version="1.0" encoding="UTF-8"?>\n<root></root>'
          : JSON.stringify({}, null, 2)
  }

  // Convert JSON object to XML with proper structure matching Swagger website
  const convertToXml = (obj: unknown, rootName: string = 'root', indent: number = 0): string => {
    const spaces = '  '.repeat(indent)
    
    if (obj === null || obj === undefined) {
      return `${spaces}<${rootName}></${rootName}>`
    }
    
    if (typeof obj === 'string') {
      return `${spaces}<${rootName}>${obj}</${rootName}>`
    }
    
    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return `${spaces}<${rootName}>${obj}</${rootName}>`
    }
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        return `${spaces}<${rootName}></${rootName}>`
      }
      
      // For arrays, create individual elements
      const items = obj.map(item => {
        // Determine the item element name based on the array name
        let itemName = 'item'
        if (rootName.endsWith('s')) {
          // Remove 's' from plural names (e.g., photoUrls -> photoUrl, tags -> tag)
          itemName = rootName.slice(0, -1)
        } else {
          // For singular names, add 'Item' (e.g., category -> categoryItem)
          itemName = rootName + 'Item'
        }
        
        return convertToXml(item, itemName, indent + 1)
      }).join('\n')
      
      return `${spaces}<${rootName}>\n${items}\n${spaces}</${rootName}>`
    }
    
    if (typeof obj === 'object') {
      const entries = Object.entries(obj as Record<string, unknown>)
      if (entries.length === 0) {
        return `${spaces}<${rootName}></${rootName}>`
      }
      
      const xmlContent = entries.map(([key, value]) => {
        // Capitalize the first letter for proper XML element names
        const elementName = key.charAt(0).toUpperCase() + key.slice(1)
        
        if (Array.isArray(value)) {
          return convertToXml(value, elementName, indent + 1)
        }
        return convertToXml(value, elementName, indent + 1)
      }).join('\n')
      
      return `${spaces}<${rootName}>\n${xmlContent}\n${spaces}</${rootName}>`
    }
    
    return `${spaces}<${rootName}>${String(obj)}</${rootName}>`
  }

  // Use selectedServer if provided, otherwise calculate default
  const defaultBaseUrl = isSwagger2(spec)
    ? `${spec.schemes?.[0] || 'https'}://${spec.host || 'localhost'}${spec.basePath || ''}`
    : spec.servers?.[0]?.url || 'https://api.example.com'
  
  const baseUrl = selectedServer || defaultBaseUrl

  const fullUrl = `${baseUrl}${path}`

  // Get all parameters including path level parameters
  const allParameters = [
    ...(spec.paths[path].parameters || []),
    ...(operation.parameters || [])
  ].map(param => {
    const resolved = isReference(param) ? resolveReference(param.$ref, spec) : param
    return resolved as Parameter
  })
  
  // Get security requirements for this endpoint
  const getSecurityRequirements = () => {
    // Check operation-level security first
    if (operation.security && operation.security.length > 0) {
      return operation.security
    }
    // Fall back to global security
    if (spec.security && spec.security.length > 0) {
      return spec.security
    }
    return []
  }
  
  const securityRequirements = getSecurityRequirements()
  const hasAuth = securityRequirements.length > 0
  
  // Check if we have credentials for required security schemes
  const isAuthenticated = securityRequirements.length === 0 || securityRequirements.some(req =>
    Object.keys(req).some(scheme => authCredentials[scheme])
  )
  
  // Get security schemes
  const getSecuritySchemes = () => {
    if (isSwagger2(spec)) {
      return spec.securityDefinitions || {}
    } else {
      const schemes: Record<string, SecurityScheme> = {}
      if (spec.components?.securitySchemes) {
        Object.entries(spec.components.securitySchemes).forEach(([name, schemeOrRef]) => {
          const scheme = isReference(schemeOrRef)
            ? resolveReference(schemeOrRef.$ref, spec) as SecurityScheme
            : schemeOrRef
          schemes[name] = scheme
        })
      }
      return schemes
    }
  }
  
  const securitySchemes = getSecuritySchemes()

  const handleParamChange = (paramName: string, value: string | number | boolean | File) => {
    setParamValues(prev => ({ ...prev, [paramName]: value }))
  }
  
  const handleLocalAuthChange = (schemeName: string, field: string, value: string) => {
    setLocalAuth(prev => ({
      ...prev,
      [schemeName]: {
        ...prev[schemeName],
        [field]: value
      }
    }))
  }

  const addArrayItem = (paramName: string, param: Parameter) => {
    setArrayParamValues(prev => {
      const current = prev[paramName] || []
      // Add default value based on items type
      const itemType = param.items?.type || 'string'
      let defaultValue: string | number | boolean = ''
      switch (itemType) {
        case 'integer':
        case 'number':
          defaultValue = 0
          break
        case 'boolean':
          defaultValue = false
          break
        default:
          defaultValue = 'string'
      }
      return { ...prev, [paramName]: [...current, defaultValue] }
    })
  }

  const updateArrayItem = (paramName: string, index: number, value: string | number | boolean) => {
    setArrayParamValues(prev => {
      const current = prev[paramName] || []
      const updated = [...current]
      updated[index] = value
      return { ...prev, [paramName]: updated }
    })
  }

  const removeArrayItem = (paramName: string, index: number) => {
    setArrayParamValues(prev => {
      const current = prev[paramName] || []
      const updated = current.filter((_, i) => i !== index)
      return { ...prev, [paramName]: updated }
    })
  }

  // Generate example value for a parameter
  const generateParamExample = (param: Parameter): string | number | boolean => {
    // Use example if available
    if (param.example !== undefined) {
      return param.example as string | number | boolean
    }
    
    // Use default if available
    if (param.default !== undefined) {
      return param.default as string | number | boolean
    }
    
    // Generate based on type
    switch (param.type) {
      case 'integer':
        return param.minimum !== undefined ? param.minimum : 1
      case 'number':
        return param.minimum !== undefined ? param.minimum : 1.0
      case 'boolean':
        return true
      case 'string':
        if (param.enum && param.enum.length > 0) {
          return param.enum[0] as string
        }
        // Generate sample based on parameter name
        const name = param.name.toLowerCase()
        if (name.includes('id')) return '1'
        if (name.includes('email')) return 'user@example.com'
        if (name.includes('name')) return 'example'
        if (name.includes('status')) return 'active'
        return 'string'
      default:
        return ''
    }
  }

  // Populate fields with example data when "Try it out" is activated
  const populateWithExamples = () => {
    // Populate parameters
    const exampleParams: Record<string, string | number | boolean | File> = {}
    const exampleArrayParams: Record<string, (string | number | boolean)[]> = {}
    
    allParameters.forEach(param => {
      if (param.in !== 'body') {
        if (param.type === 'array') {
          // For array parameters, add one example item
          const itemType = param.items?.type || 'string'
          let exampleValue: string | number | boolean = 'string'
          switch (itemType) {
            case 'integer':
            case 'number':
              exampleValue = 0
              break
            case 'boolean':
              exampleValue = false
              break
            default:
              exampleValue = 'string'
          }
          exampleArrayParams[param.name] = [exampleValue]
        } else {
          exampleParams[param.name] = generateParamExample(param)
        }
      }
    })
    
    setParamValues(exampleParams)
    setArrayParamValues(exampleArrayParams)

    // Populate request body - handle both Swagger 2.0 and OpenAPI 3.x
    // Use the current content type selection, but don't override if already set
    const currentContentType = selectedRequestBodyContentType || 'application/json'
    
    // Check for Swagger 2.0 body parameter first
    const bodyParam = allParameters.find(p => p.in === 'body')
    if (bodyParam && bodyParam.schema) {
      const exampleBody = generateExample(bodyParam.schema, currentContentType)
      setBodyValue(exampleBody)
    } else {
      // Check for OpenAPI 3.x requestBody
      const requestBodySchema = getRequestBodySchema()
      if (requestBodySchema) {
        const exampleBody = generateExample(requestBodySchema.schema, currentContentType)
        setBodyValue(exampleBody)
      }
    }
  }

  const validateRequest = (): string[] => {
    const errors: string[] = []

    // Validate required parameters (skip body parameters as they're validated separately)
    allParameters.forEach(param => {
      if (param.in === 'body') {
        // Skip body parameters - they're validated in the body validation section
        return
      }
      
      if (param.required) {
        // Handle array parameters
        if (param.type === 'array') {
          const arrayValues = arrayParamValues[param.name] || []
          if (arrayValues.length === 0) {
            errors.push(`${param.name} is required`)
          }
          return
        }
        
        // Handle regular parameters
        const value = paramValues[param.name]
        if (value === undefined || value === null || value === '') {
          errors.push(`${param.name} is required`)
        } else {
          // Validate type
          if (param.type === 'integer' || param.type === 'number') {
            let numValue: number
            if (typeof value === 'string') {
              numValue = parseFloat(value)
              if (isNaN(numValue)) {
                errors.push(`${param.name} must be a valid ${param.type}`)
              }
            } else if (typeof value === 'number') {
              numValue = value
            } else {
              errors.push(`${param.name} must be a valid ${param.type}`)
              return
            }
            
            if (!isNaN(numValue)) {
              // Check minimum
              if (param.minimum !== undefined && numValue < param.minimum) {
                errors.push(`${param.name} must be >= ${param.minimum}`)
              }
              // Check maximum
              if (param.maximum !== undefined && numValue > param.maximum) {
                errors.push(`${param.name} must be <= ${param.maximum}`)
              }
            }
          }
          
          // Validate string patterns and length
          if (param.type === 'string' && typeof value === 'string') {
            if (param.minLength !== undefined && value.length < param.minLength) {
              errors.push(`${param.name} must be at least ${param.minLength} characters`)
            }
            if (param.maxLength !== undefined && value.length > param.maxLength) {
              errors.push(`${param.name} must be at most ${param.maxLength} characters`)
            }
            if (param.pattern && !new RegExp(param.pattern).test(value)) {
              errors.push(`${param.name} format is invalid`)
            }
          }
          
          // Validate enum
          if (param.enum && param.enum.length > 0) {
            if (!param.enum.includes(value)) {
              errors.push(`${param.name} must be one of: ${param.enum.join(', ')}`)
            }
          }
        }
      }
    })

    // Validate required body (only for methods that support body)
    if (['post', 'put', 'patch'].includes(method.toLowerCase())) {
      // Check if it's a multipart form first (which uses paramValues instead of bodyValue)
      const bodySchemaData = getRequestBodySchema()
      const isMultipartBody = bodySchemaData?.isMultipart || false
      const formDataParams = allParameters.filter(p => p.in === 'formData')
      
      if (!isMultipartBody && formDataParams.length === 0) {
        // Swagger 2.0 body parameter
        const bodyParam = allParameters.find(p => p.in === 'body')
        
        if (bodyParam) {
          // Swagger 2.0 body parameter exists
          if (bodyParam.required && !bodyValue.trim()) {
            errors.push('Request body is required')
          } else if (bodyValue.trim()) {
            // Validate format based on content type
            const currentContentType = selectedRequestBodyContentType || 'application/json'
            if (currentContentType.includes('json')) {
              try {
                JSON.parse(bodyValue)
              } catch {
                errors.push('Request body must be valid JSON')
              }
            } else if (currentContentType.includes('xml')) {
              // Basic XML validation - check for well-formed XML
              const trimmedBody = bodyValue.trim()
              if (!trimmedBody.startsWith('<') || !trimmedBody.endsWith('>')) {
                errors.push('Request body must be valid XML')
              }
            }
          }
        } else if (operation.requestBody) {
          // OpenAPI 3.x requestBody (only if no Swagger 2.0 body param)
          const requestBody = isReference(operation.requestBody)
            ? resolveReference(operation.requestBody.$ref, spec) as RequestBody
            : operation.requestBody
          
          if (requestBody?.required && !bodyValue.trim()) {
            errors.push('Request body is required')
          } else if (bodyValue.trim()) {
            // Validate format based on content type
            const currentContentType = selectedRequestBodyContentType || 'application/json'
            if (currentContentType.includes('json')) {
              try {
                JSON.parse(bodyValue)
              } catch {
                errors.push('Request body must be valid JSON')
              }
            } else if (currentContentType.includes('xml')) {
              // Basic XML validation - check for well-formed XML
              const trimmedBody = bodyValue.trim()
              if (!trimmedBody.startsWith('<') || !trimmedBody.endsWith('>')) {
                errors.push('Request body must be valid XML')
              }
            }
          }
        }
      }
    }

    return errors
  }

  const generateCurlCommand = (url: string, requestOptions: RequestInit, bodyValue?: string) => {
    const lines = [`curl -X '${requestOptions.method}' \\`]
    lines.push(`  '${url}' \\`)
    
    // Add headers
    if (requestOptions.headers) {
      Object.entries(requestOptions.headers as Record<string, string>).forEach(([key, value]) => {
        lines.push(`  -H '${key}: ${value}' \\`)
      })
    }
    
    // Add body if present and not FormData
    if (requestOptions.body && typeof requestOptions.body === 'string') {
      // Escape single quotes in JSON
      const escapedBody = bodyValue?.replace(/'/g, "'\\''") || ''
      lines.push(`  -d '${escapedBody}'`)
    } else if (requestOptions.body instanceof FormData) {
      // For FormData, indicate it's multipart
      lines.push(`  --form '...'`)
    }
    
    // Remove trailing backslash from last line
    const lastLine = lines[lines.length - 1]
    if (lastLine.endsWith(' \\')) {
      lines[lines.length - 1] = lastLine.slice(0, -2)
    }
    
    return lines.join('\n')
  }

  const handleExecute = async () => {
    // Validate before executing
    const errors = validateRequest()
    if (errors.length > 0) {
      setValidationErrors(errors)
      setShowValidationModal(true)
      return
    }

    setLoading(true)
    setResponse(null)
    setCurlCommand('')
    setRequestUrl('')

    try {
      // Build URL with path parameters
      let url = fullUrl
      const pathParams = allParameters.filter(p => p.in === 'path')
      pathParams.forEach(param => {
        const value = paramValues[param.name]
        if (value !== undefined && value !== null && !(value instanceof File)) {
          url = url.replace(`{${param.name}}`, encodeURIComponent(String(value)))
        } else {
          url = url.replace(`{${param.name}}`, '')
        }
      })

      // Build query parameters
      const queryParams = allParameters.filter(p => p.in === 'query')
      const queryPairs: string[] = queryParams
        .map(param => {
          // Handle array parameters
          if (param.type === 'array') {
            const arrayValues = arrayParamValues[param.name] || []
            if (arrayValues.length === 0) return null
            
            // Use collectionFormat if specified, default to multi (like Swagger UI)
            const collectionFormat = param.collectionFormat || 'multi'
            switch (collectionFormat) {
              case 'csv':
                // Comma-separated values: tags=tag1,tag2,tag3
                return `${param.name}=${arrayValues.map(v => encodeURIComponent(String(v))).join(',')}`
              case 'multi':
                // Multiple query params: tags=tag1&tags=tag2&tags=tag3
                return arrayValues.map(v => `${param.name}=${encodeURIComponent(String(v))}`).join('&')
              case 'ssv':
                // Space-separated values: tags=tag1 tag2 tag3
                return `${param.name}=${arrayValues.map(v => encodeURIComponent(String(v))).join('%20')}`
              case 'tsv':
                // Tab-separated values: tags=tag1\ttag2\ttag3
                return `${param.name}=${arrayValues.map(v => encodeURIComponent(String(v))).join('%09')}`
              case 'pipes':
                // Pipe-separated values: tags=tag1|tag2|tag3
                return `${param.name}=${arrayValues.map(v => encodeURIComponent(String(v))).join('|')}`
              default:
                return arrayValues.map(v => `${param.name}=${encodeURIComponent(String(v))}`).join('&')
            }
          }
          
          // Handle regular parameters
          const value = paramValues[param.name]
          if (value !== undefined && value !== '' && !(value instanceof File)) {
            return `${param.name}=${encodeURIComponent(String(value))}`
          }
          return null
        })
        .filter(Boolean) as string[]
      
      // Add API key to query if needed
      if (hasAuth) {
        // Use local auth if enabled, otherwise use global auth
        const activeCredentials = useLocalAuth ? localAuth : authCredentials
          
        securityRequirements.forEach(requirement => {
          Object.entries(requirement).forEach(([schemeName]) => {
            const credentials = activeCredentials[schemeName]
            if (!credentials) return
            
            const schemeOrRef = securitySchemes[schemeName]
            const scheme = isReference(schemeOrRef)
              ? resolveReference(schemeOrRef.$ref, spec) as SecurityScheme
              : schemeOrRef
            
            if (scheme?.type === 'apiKey' && scheme.in === 'query' && scheme.name && credentials.value) {
              queryPairs.push(`${scheme.name}=${encodeURIComponent(credentials.value)}`)
            }
          })
        })
      }
      
      const queryString = queryPairs.join('&')

      if (queryString) {
        url += `?${queryString}`
      }

      // Build headers
      const headers: Record<string, string> = {
        'Accept': selectedRequestBodyContentType || 'application/json',
      }

      const headerParams = allParameters.filter(p => p.in === 'header')
      headerParams.forEach(param => {
        const value = paramValues[param.name]
        if (value !== undefined && value !== null && !(value instanceof File)) {
          headers[param.name] = String(value)
        }
      })
      
      // Apply authentication headers
      if (hasAuth) {
        // Use local auth if enabled, otherwise use global auth
        const activeCredentials = useLocalAuth ? localAuth : authCredentials
          
        securityRequirements.forEach(requirement => {
          Object.entries(requirement).forEach(([schemeName]) => {
            const credentials = activeCredentials[schemeName]
            if (!credentials) return
            
            const schemeOrRef = securitySchemes[schemeName]
            const scheme = isReference(schemeOrRef)
              ? resolveReference(schemeOrRef.$ref, spec) as SecurityScheme
              : schemeOrRef
            
            if (!scheme) return
            
            // Apply authentication based on scheme type
            switch (scheme.type) {
              case 'apiKey':
                if (scheme.in === 'header' && scheme.name && credentials.value) {
                  headers[scheme.name] = credentials.value
                } else if (scheme.in === 'cookie' && scheme.name && credentials.value) {
                  // Add cookie to headers
                  headers['Cookie'] = `${scheme.name}=${credentials.value}`
                }
                // Note: query apiKey is handled in query parameters
                break
                
              case 'http':
                if (scheme.scheme === 'basic' && credentials.username && credentials.password) {
                  const encoded = btoa(`${credentials.username}:${credentials.password}`)
                  headers['Authorization'] = `Basic ${encoded}`
                } else if (scheme.scheme === 'bearer' && credentials.token) {
                  headers['Authorization'] = `Bearer ${credentials.token}`
                }
                break
                
              case 'oauth2':
              case 'openIdConnect':
                if (credentials.token) {
                  headers['Authorization'] = `Bearer ${credentials.token}`
                }
                break
            }
          })
        })
      }

      // Check if we have formData parameters
      const formDataParams = allParameters.filter(p => p.in === 'formData')
      const hasFiles = formDataParams.some(p => p.type === 'file')
      
      // Check if this operation consumes multipart/form-data (Swagger 2.0)
      const consumesMultipart = operation.consumes?.includes('multipart/form-data') || 
                               (isSwagger2(spec) && spec.consumes?.includes('multipart/form-data'))

      // Build request options
      const requestOptions: RequestInit = {
        method: method.toUpperCase(),
        headers,
      }

      // Add body if needed
      if (['post', 'put', 'patch'].includes(method.toLowerCase())) {
        // Check if we have OpenAPI 3.x multipart request body
        const bodySchemaData = getRequestBodySchema()
        const isMultipartBody = bodySchemaData?.isMultipart || false
        
        if (formDataParams.length > 0 || consumesMultipart || isMultipartBody) {
          // Use FormData for formData parameters or when multipart is specified
          const formData = new FormData()
          
          // Add formData parameters (Swagger 2.0)
          formDataParams.forEach(param => {
            const value = paramValues[param.name]
            if (value !== undefined && value !== null) {
              if (value instanceof File) {
                formData.append(param.name, value)
              } else {
                formData.append(param.name, String(value))
              }
            }
          })
          
          // Add OpenAPI 3.x multipart fields
          if (isMultipartBody) {
            Object.entries(paramValues).forEach(([key, value]) => {
              if (key.startsWith('body.') && value !== undefined && value !== null && value !== '') {
                const fieldName = key.substring(5) // Remove 'body.' prefix
                if (value instanceof File) {
                  formData.append(fieldName, value)
                } else {
                  formData.append(fieldName, String(value))
                }
              }
            })
          }
          
          // For body parameters when using multipart (Swagger 2.0)
          const bodyParam = getBodyParameter()
          if (bodyParam && bodyValue && !isMultipartBody) {
            try {
              // If it's JSON, parse and add each field
              const parsed = JSON.parse(bodyValue)
              Object.entries(parsed).forEach(([key, val]) => {
                if (val !== undefined && val !== null) {
                  formData.append(key, String(val))
                }
              })
            } catch {
              // If not JSON, add as is
              formData.append('body', bodyValue)
            }
          }
          
          // Don't set Content-Type for FormData, let browser set it with boundary
          delete headers['Content-Type']
          if (consumesMultipart || hasFiles || isMultipartBody) {
            // Update Accept header for file uploads
            headers['Accept'] = '*/*'
          }
          requestOptions.body = formData
        } else if (bodyValue) {
          // Use selected content type or default to application/json
          const bodySchemaData = getRequestBodySchema()
          const contentTypes = bodySchemaData?.contentTypes || getSwagger2ContentTypes()
          const selectedContentType = bodySchemaData?.selectedContentType || (selectedRequestBodyContentType || contentTypes[0] || 'application/json')
          
          headers['Content-Type'] = selectedContentType
          requestOptions.body = bodyValue
        }
      }

      // Generate and store curl command and request URL
      const curl = generateCurlCommand(url, requestOptions, bodyValue)
      setCurlCommand(curl)
      setRequestUrl(url)

      // Execute request
      const startTime = Date.now()
      const res = await fetch(url, requestOptions)
      const duration = Date.now() - startTime

      // Get response data
      let data
      const responseContentType = res.headers.get('content-type')
      if (responseContentType?.includes('application/json')) {
        const jsonData = await res.json()
        // Pretty format JSON responses
        data = JSON.stringify(jsonData, null, 2)
      } else if (responseContentType?.includes('application/xml') || responseContentType?.includes('text/xml')) {
        const xmlText = await res.text()
        // Pretty format XML responses
        data = formatXml(xmlText)
      } else {
        data = await res.text()
      }

      const responseHeaders = Object.fromEntries(res.headers.entries())
      
      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        data,
        duration,
        contentType: responseContentType || undefined,
      })
    } catch (error) {
      setResponse({
        error: error instanceof Error ? error.message : 'Request failed',
      })
    } finally {
      setLoading(false)
    }
  }



  const getRequestBodySchema = () => {
    if (!operation.requestBody) return null
    
    const requestBody = isReference(operation.requestBody)
      ? resolveReference(operation.requestBody.$ref, spec) as RequestBody
      : operation.requestBody

    // Get all available content types
    const contentTypes = requestBody.content ? Object.keys(requestBody.content) : []
    
    // Determine selected content type - use current state if set, otherwise use default
    let selectedContentType = selectedRequestBodyContentType
    if (!selectedContentType && contentTypes.length > 0) {
      // Default: prefer multipart/form-data, then application/json, then first available
      if (contentTypes.includes('multipart/form-data')) {
        selectedContentType = 'multipart/form-data'
      } else if (contentTypes.includes('application/json')) {
        selectedContentType = 'application/json'
      } else {
        selectedContentType = contentTypes[0]
      }
    }
    
    const content = selectedContentType ? requestBody.content?.[selectedContentType] : undefined
    if (!content || !content.schema) return null

    const schema = isReference(content.schema)
      ? resolveReference(content.schema.$ref, spec) as Schema
      : content.schema
    
    return { 
      schema, 
      isMultipart: selectedContentType === 'multipart/form-data',
      contentTypes,
      selectedContentType
    }
  }

  // For Swagger 2.0
  const getBodyParameter = () => {
    return allParameters.find(p => p.in === 'body')
  }

  // Get content types for Swagger 2.0 (from 'consumes')
  const getSwagger2ContentTypes = () => {
    // Check operation-level consumes first, then spec-level
    const consumes = operation.consumes || (isSwagger2(spec) ? spec.consumes : null)
    return consumes || []
  }

  return (
    <div className={cn(
      "bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden",
      operation.deprecated && "opacity-75"
    )}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
      >
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span className={cn('text-xs font-medium px-2 py-1 rounded uppercase', methodColors[method as keyof typeof methodColors])}>
            {method}
          </span>
          <code className={cn(
            "text-sm font-mono",
            operation.deprecated && "text-gray-400 dark:text-gray-600 line-through"
          )}>{path}</code>
          {hasAuth && (
            <div className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded text-xs",
              isAuthenticated
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
            )}>
              {isAuthenticated ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              {securityRequirements.map((req, i) => (
                <span key={i}>
                  {Object.keys(req).join(', ')}
                </span>
              ))}
            </div>
          )}
          {operation.deprecated && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              <AlertTriangle className="h-3 w-3" />
              <span>Deprecated</span>
            </div>
          )}
        </div>
        {operation.summary && (
          <span className="text-sm text-gray-600 dark:text-gray-400">{operation.summary}</span>
        )}
      </button>

      {/* Content */}
      {expanded && (
        <div className="border-t border-gray-200 dark:border-gray-800">
          {/* Description */}
          {operation.description && (
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">{operation.description}</p>
            </div>
          )}

          {/* Deprecated Warning */}
          {operation.deprecated && (
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">This endpoint is deprecated</p>
                  <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                    This API endpoint is no longer maintained and may be removed in future versions. 
                    Please use alternative endpoints if available.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* URL */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <CodeBlock 
                code={fullUrl} 
                language="text" 
                filename="endpoint-url.txt"
                className="flex-1"
                showDownloadButton={false}
              />
              <Button
                variant={tryItOut ? 'outline' : 'default'}
                size="sm"
                onClick={() => {
                  if (!tryItOut) {
                    // Populate with example data when activating "Try it out"
                    populateWithExamples()
                  }
                  setTryItOut(!tryItOut)
                }}
                className={tryItOut ? 'border-red-500 text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-950' : ''}
              >
                {tryItOut ? 'Cancel' : 'Try it out'}
              </Button>
            </div>
          </div>

          {/* Parameters - Always visible with disabled inputs */}
          {(() => {
            const hasParams = allParameters.filter(p => p.in !== 'body').length > 0
            const bodySchemaData = getRequestBodySchema()
            const bodyParam = getBodyParameter()
            const hasBody = bodySchemaData || bodyParam
            
            // Show parameters section if there are params OR a request body
            if (!hasParams && !hasBody) return null
            
            return (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
                <h4 className="font-medium mb-3">{hasParams ? 'Parameters' : 'Request Body'}</h4>
                {hasParams && (
              <div className="space-y-3">
                {allParameters.filter(p => p.in !== 'body').map((param, index) => (
                  <div key={`${param.name}-${index}`} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">
                        {param.name}
                        {param.required && <span className="text-red-500">*</span>}
                      </label>
                      <span className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                        {param.in}
                      </span>
                      {param.type && (
                        param.type === 'file' ? (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Upload className="h-3 w-3" />
                            file
                          </span>
                        ) : param.type === 'array' ? (
                          <span className="text-xs text-gray-500">{param.items?.type || 'string'}[]</span>
                        ) : (
                          <span className="text-xs text-gray-500">{param.type}</span>
                        )
                      )}
                    </div>
                    {param.description && (
                      <p className="text-xs text-gray-500">{param.description}</p>
                    )}
                    {param.type === 'file' ? (
                      <div className="space-y-2">
                        <div className="relative">
                          <input
                            type="file"
                            id={`file-${param.name}`}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handleParamChange(param.name, file)
                              }
                            }}
                            disabled={!tryItOut}
                            className="sr-only"
                          />
                          <label
                            htmlFor={`file-${param.name}`}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 text-sm border rounded-md cursor-pointer transition-colors",
                              tryItOut 
                                ? "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 hover:border-primary"
                                : "border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 cursor-not-allowed opacity-60"
                            )}
                          >
                            <Upload className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {paramValues[param.name] instanceof File
                                ? (paramValues[param.name] as File).name
                                : 'Choose file...'}
                            </span>
                          </label>
                        </div>
                        {paramValues[param.name] instanceof File && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>Selected:</span>
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                {(paramValues[param.name] as File).name}
                              </span>
                              <span>({((paramValues[param.name] as File).size / 1024).toFixed(2)} KB)</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleParamChange(param.name, '')}
                              className="text-xs text-red-600 dark:text-red-400 hover:underline"
                              disabled={!tryItOut}
                            >
                              Clear
                            </button>
                          </div>
                        )}
                      </div>
                    ) : param.type === 'array' ? (
                      <div className="space-y-2">
                        {(arrayParamValues[param.name] || []).map((value, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              placeholder={param.items?.type || 'string'}
                              value={String(value)}
                              onChange={(e) => updateArrayItem(param.name, index, e.target.value)}
                              disabled={!tryItOut}
                              className="max-w-md"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeArrayItem(param.name, index)}
                              disabled={!tryItOut}
                              className="bg-white border-red-500 text-red-600 hover:bg-red-50 dark:bg-gray-950 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-950 px-2 h-9"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addArrayItem(param.name, param)}
                          disabled={!tryItOut}
                          className="text-xs"
                        >
                          Add {param.items?.type || 'string'} item
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Input
                          placeholder={param.default ? `Default: ${param.default}` : `Enter ${param.name}`}
                          value={paramValues[param.name] instanceof File 
                            ? (paramValues[param.name] as File).name 
                            : String(paramValues[param.name] || '')}
                          onChange={(e) => handleParamChange(param.name, e.target.value)}
                          disabled={!tryItOut}
                        />
                        {param.example !== undefined && (
                          <div className="text-xs text-gray-500 mt-1">
                            <span className="font-medium">Example: </span>
                            <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">{String(param.example)}</code>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
                )}
              </div>
            )
          })()}

          {/* Request Body - Always visible */}
          {(() => {
            const bodySchemaData = getRequestBodySchema()
            const bodyParam = getBodyParameter()
            const hasBody = bodySchemaData || bodyParam
            
            if (!hasBody) return null
            
            // Get content types - either from OpenAPI 3.x or Swagger 2.0
            const contentTypes = bodySchemaData?.contentTypes || getSwagger2ContentTypes()
            const selectedContentType = bodySchemaData?.selectedContentType || (selectedRequestBodyContentType || contentTypes[0])
            
            // Schema is now reactive to content type changes
            const schema = bodySchemaData?.schema || bodyParam?.schema
            const isMultipart = bodySchemaData?.isMultipart || false
            const isRequired = bodyParam?.required || false
            
            return (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
                <h4 className="font-medium mb-3">
                  Request Body
                  {isRequired && <span className="text-red-500 ml-1">*</span>}
                  {isMultipart && (
                    <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                      multipart/form-data
                    </span>
                  )}
                </h4>

                {!tryItOut ? (
                  // Show schema/example toggle when not in try it out mode
                  <div className="space-y-2">
                    {/* Toggle buttons and Content Type dropdown */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleRequestBodyView}
                        className={cn(
                          'text-xs px-2 py-1 rounded transition-colors',
                          requestBodyViewMode === 'schema'
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        )}
                      >
                        Schema
                      </button>
                      <button
                        onClick={toggleRequestBodyView}
                        className={cn(
                          'text-xs px-2 py-1 rounded transition-colors',
                          requestBodyViewMode === 'example'
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        )}
                      >
                        Example
                      </button>
                      
                      {/* Parameter content type dropdown */}
                      {contentTypes.length > 1 && (
                        <select
                          value={selectedContentType || contentTypes[0]}
                          onChange={(e) => updateBodyValueForContentType(e.target.value)}
                          className="text-xs border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-950"
                        >
                          {contentTypes.map(ct => (
                            <option key={ct} value={ct}>{ct}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Content based on view mode */}
                    {requestBodyViewMode === 'schema' ? (
                      schema && (
                        <div className="border border-gray-200 dark:border-gray-800 rounded-md p-3">
                          <SwaggerSchema
                            schema={schema}
                            spec={spec}
                          />
                        </div>
                      )
                    ) : (
                      schema && <CodeBlock code={generateExample(schema, selectedContentType)} contentType={selectedContentType} />
                    )}
                  </div>
                ) : (
                  // Show editable inputs when in try it out mode
                  <div className="space-y-2">
                    {/* Content Type dropdown in Try it out mode */}
                    {contentTypes.length > 1 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Parameter content type:</span>
                        <select
                          value={selectedContentType || contentTypes[0]}
                          onChange={(e) => updateBodyValueForContentType(e.target.value)}
                          className="text-sm border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-950"
                        >
                          {contentTypes.map(ct => (
                            <option key={ct} value={ct}>{ct}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    {!isMultipart ? (
                      <Textarea
                        className="font-mono text-sm"
                        rows={10}
                        placeholder="Enter request body JSON..."
                        value={bodyValue}
                        onChange={(e) => setBodyValue(e.target.value)}
                      />
                    ) : (
                      schema && !isReference(schema) && schema.properties && (
                        <div className="space-y-3">
                          {Object.entries(schema.properties).map(([propName, propSchema]) => {
                            const prop = isReference(propSchema) 
                              ? resolveReference((propSchema as { $ref: string }).$ref, spec) as Schema
                              : propSchema as Schema
                            const isFileUpload = prop.format === 'binary' || prop.format === 'base64'
                            
                            return (
                              <div key={propName} className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <label className="text-sm font-medium">
                                    {propName}
                                    {schema.required?.includes(propName) && <span className="text-red-500">*</span>}
                                  </label>
                                  {isFileUpload && (
                                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                                      <Upload className="h-3 w-3" />
                                      file
                                    </span>
                                  )}
                                  <span className="text-xs text-gray-500">{prop.type}</span>
                                </div>
                                {prop.description && (
                                  <p className="text-xs text-gray-500">{prop.description}</p>
                                )}
                                {isFileUpload ? (
                                  <div className="space-y-2">
                                    <div className="relative">
                                      <input
                                        type="file"
                                        id={`multipart-file-${propName}`}
                                        onChange={(e) => {
                                          const file = e.target.files?.[0]
                                          if (file) {
                                            handleParamChange(`body.${propName}`, file)
                                          }
                                        }}
                                        className="sr-only"
                                      />
                                      <label
                                        htmlFor={`multipart-file-${propName}`}
                                        className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md cursor-pointer transition-colors border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 hover:border-primary"
                                      >
                                        <Upload className="h-4 w-4 text-gray-500" />
                                        <span className="text-gray-700 dark:text-gray-300">
                                          {paramValues[`body.${propName}`] instanceof File
                                            ? (paramValues[`body.${propName}`] as File).name
                                            : 'Choose file...'}
                                        </span>
                                      </label>
                                    </div>
                                    {paramValues[`body.${propName}`] instanceof File && (
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                          <span>Selected:</span>
                                          <span className="font-medium text-gray-700 dark:text-gray-300">
                                            {(paramValues[`body.${propName}`] as File).name}
                                          </span>
                                          <span>({((paramValues[`body.${propName}`] as File).size / 1024).toFixed(2)} KB)</span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleParamChange(`body.${propName}`, '')}
                                          className="text-xs text-red-600 dark:text-red-400 hover:underline"
                                        >
                                          Clear
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <Input
                                    placeholder={`Enter ${propName}`}
                                    value={paramValues[`body.${propName}`] instanceof File 
                                      ? (paramValues[`body.${propName}`] as File).name 
                                      : String(paramValues[`body.${propName}`] || '')}
                                    onChange={(e) => handleParamChange(`body.${propName}`, e.target.value)}
                                  />
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )
          })()}

          {/* Authentication & Execution */}
          {tryItOut && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
              <div className="space-y-4">
                {/* Authentication */}
                {hasAuth && (
                  <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-medium flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Authorization
                        <span className="text-xs text-gray-500">
                          ({securityRequirements.length} scheme{securityRequirements.length !== 1 ? 's' : ''} required)
                        </span>
                      </h5>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={useLocalAuth}
                          onChange={(e) => setUseLocalAuth(e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        Use custom auth for this request
                      </label>
                    </div>
                    
                    {useLocalAuth && (
                      <div className="space-y-3">
                        {securityRequirements.map((requirement, reqIndex) => (
                          <div key={reqIndex} className="space-y-3">
                            {Object.entries(requirement).map(([schemeName]) => {
                              const scheme = securitySchemes[schemeName]
                              if (!scheme) return null
                              
                              return (
                                <div key={schemeName} className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{schemeName}</span>
                                    <span className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                                      {scheme.type}
                                    </span>
                                  </div>
                                  
                                  {scheme.type === 'apiKey' && (
                                    <Input
                                      type="password"
                                      placeholder={`Enter ${scheme.name || 'API Key'}`}
                                      value={localAuth[schemeName]?.value || ''}
                                      onChange={(e) => handleLocalAuthChange(schemeName, 'value', e.target.value)}
                                      className="text-sm"
                                    />
                                  )}
                                  
                                  {scheme.type === 'http' && scheme.scheme === 'basic' && (
                                    <div className="space-y-2">
                                      <Input
                                        type="text"
                                        placeholder="Username"
                                        value={localAuth[schemeName]?.username || ''}
                                        onChange={(e) => handleLocalAuthChange(schemeName, 'username', e.target.value)}
                                        className="text-sm"
                                      />
                                      <Input
                                        type="password"
                                        placeholder="Password"
                                        value={localAuth[schemeName]?.password || ''}
                                        onChange={(e) => handleLocalAuthChange(schemeName, 'password', e.target.value)}
                                        className="text-sm"
                                      />
                                    </div>
                                  )}
                                  
                                  {scheme.type === 'http' && scheme.scheme === 'bearer' && (
                                    <Input
                                      type="password"
                                      placeholder="Enter Bearer Token"
                                      value={localAuth[schemeName]?.token || ''}
                                      onChange={(e) => handleLocalAuthChange(schemeName, 'token', e.target.value)}
                                      className="text-sm"
                                    />
                                  )}
                                  
                                  {(scheme.type === 'oauth2' || scheme.type === 'openIdConnect') && (
                                    <Input
                                      type="password"
                                      placeholder="Enter Access Token"
                                      value={localAuth[schemeName]?.token || ''}
                                      onChange={(e) => handleLocalAuthChange(schemeName, 'token', e.target.value)}
                                      className="text-sm"
                                    />
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {!useLocalAuth && (
                      <div className="text-sm text-gray-500">
                        {isAuthenticated ? (
                          <div className="flex items-center gap-2">
                            <Unlock className="h-4 w-4 text-green-600" />
                            Using global authorization
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4 text-orange-600" />
                            No global authorization set. Enable custom auth above.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Execute and Clear Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleExecute}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      'Executing...'
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Execute
                      </>
                    )}
                  </Button>
                  {response && (
                    <Button
                      onClick={() => {
                        setResponse(null)
                        setCurlCommand('')
                        setRequestUrl('')
                      }}
                      variant="outline"
                      disabled={loading}
                      className="border-red-500 text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-950"
                    >
                      Clear
                    </Button>
                  )}
                </div>

                {/* Curl Command and Request URL */}
                {(curlCommand || requestUrl) && (
                  <div className="mt-4 space-y-3">
                    {/* Curl */}
                    {curlCommand && (
                      <div className="space-y-2">
                        <h6 className="text-sm font-medium">Curl</h6>
                        <CodeBlock code={curlCommand} language="bash" filename="request.sh" />
                      </div>
                    )}

                    {/* Request URL */}
                    {requestUrl && (
                      <div className="space-y-2">
                        <h6 className="text-sm font-medium">Request URL</h6>
                        <CodeBlock code={requestUrl} language="text" filename="request-url.txt" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Response */}
          {response && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
              <div className="space-y-3">
                <h5 className="text-sm font-medium">Response</h5>
                
                {response.error ? (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                    <p className="text-sm text-red-700 dark:text-red-300">Error: {response.error}</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-sm font-medium px-2 py-1 rounded',
                        response.status && response.status >= 200 && response.status < 300
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : response.status && response.status >= 400
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                      )}>
                        {response.status} {response.statusText}
                      </span>
                      <span className="text-xs text-gray-500">
                        {response.duration}ms
                      </span>
                    </div>
                    
                    {/* Response Headers */}
                    {response.headers && Object.keys(response.headers).length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h6 className="text-sm font-medium">Response Headers</h6>
                          <span className="text-xs text-gray-500">
                            {Object.keys(response.headers).length} header{Object.keys(response.headers).length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-3 overflow-x-auto">
                          <div className="space-y-1">
                            {Object.entries(response.headers).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => (
                              <div key={key} className="flex gap-2 text-xs font-mono">
                                <span className="text-gray-600 dark:text-gray-400 min-w-fit">{key}:</span>
                                <span className="text-gray-900 dark:text-gray-100 break-all">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 italic">
                          Note: Due to CORS restrictions, browsers may limit which response headers are accessible. 
                          Some headers may only be visible if the server includes them in Access-Control-Expose-Headers.
                        </p>
                      </div>
                    )}
                    
                    {/* Response Body */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h6 className="text-sm font-medium">Response Body</h6>
                        {/* Response Content Type Dropdown */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Content Type:</span>
                          <select
                            value={response.contentType || 'application/json'}
                            onChange={(e) => {
                              const newContentType = e.target.value
                              // Convert response data based on new content type
                              let convertedData = response.data
                              
                              // Determine the original data type by trying to parse it
                              const originalData = String(response.data)
                              let isOriginalJson = false
                              let isOriginalXml = false
                              
                              try {
                                JSON.parse(originalData)
                                isOriginalJson = true
                              } catch {
                                // Not JSON
                              }
                              
                              if (!isOriginalJson && originalData.trim().startsWith('<') && originalData.trim().endsWith('>')) {
                                isOriginalXml = true
                              }
                              
                              if (newContentType === 'application/xml' && isOriginalJson) {
                                // Convert JSON to XML
                                try {
                                  const parsed = JSON.parse(originalData)
                                  convertedData = convertToXml(parsed, 'response')
                                } catch {
                                  convertedData = originalData
                                }
                              } else if (newContentType === 'application/json' && isOriginalXml) {
                                // Convert XML to JSON (simplified - just keep as string for now)
                                convertedData = originalData
                              } else if (newContentType === 'application/json' && isOriginalJson) {
                                // Ensure JSON is pretty formatted
                                try {
                                  const parsed = JSON.parse(originalData)
                                  convertedData = JSON.stringify(parsed, null, 2)
                                } catch {
                                  convertedData = originalData
                                }
                              } else if (newContentType === 'application/xml' && isOriginalXml) {
                                // Ensure XML is pretty formatted
                                convertedData = formatXml(originalData)
                              } else {
                                // Keep original data
                                convertedData = originalData
                              }
                              
                              setResponse(prev => prev ? { 
                                ...prev, 
                                contentType: newContentType,
                                data: convertedData
                              } : null)
                            }}
                            className="text-xs border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-950"
                          >
                            <option value="application/json">application/json</option>
                            <option value="application/xml">application/xml</option>
                            <option value="text/plain">text/plain</option>
                            <option value="text/html">text/html</option>
                          </select>
                        </div>
                      </div>
                      <CodeBlock 
                        code={String(response.data)}
                        contentType={response.contentType}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Responses */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
            <h4 className="font-medium mb-3">Responses</h4>
            <div className="space-y-2">
              {Object.entries(operation.responses).map(([status, response]) => {
                const resolvedResponse = isReference(response)
                  ? resolveReference(response.$ref, spec) as Response
                  : response
                
                // Determine if this is OpenAPI 3.x (has content) or Swagger 2.0 (has schema)
                const hasContent = resolvedResponse.content && Object.keys(resolvedResponse.content).length > 0
                let contentTypes: string[] = []
                let selectedContentType: string | null = null
                let schema: unknown = null
                
                if (hasContent) {
                  // OpenAPI 3.x - use defined content types
                  contentTypes = Object.keys(resolvedResponse.content!)
                  selectedContentType = getSelectedContentType(status, contentTypes)
                  schema = resolvedResponse.content![selectedContentType]?.schema
                } else {
                  // Swagger 2.0 - generate multiple content types (JSON and XML)
                  contentTypes = ['application/json', 'application/xml']
                  selectedContentType = getSelectedContentType(status, contentTypes)
                  schema = resolvedResponse.schema
                }
                
                return (
                  <div key={status} className="flex items-start gap-3">
                    <span className={cn(
                      'text-sm font-medium px-2 py-0.5 rounded',
                      status.startsWith('2')
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : status.startsWith('4')
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        : status.startsWith('5')
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    )}>
                      {status}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {resolvedResponse.description}
                      </p>
                      {schema !== null && schema !== undefined && (
                        <div className="mt-2">
                          {/* Toggle buttons and Content Type dropdown */}
                          <div className="flex items-center gap-2 mb-2">
                            <button
                              onClick={() => toggleResponseView(status)}
                              className={cn(
                                'text-xs px-2 py-1 rounded transition-colors',
                                getResponseViewMode(status) === 'schema'
                                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                              )}
                            >
                              Schema
                            </button>
                            <button
                              onClick={() => toggleResponseView(status)}
                              className={cn(
                                'text-xs px-2 py-1 rounded transition-colors',
                                getResponseViewMode(status) === 'example'
                                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                              )}
                            >
                              Example
                            </button>
                            
                            {/* Content Type dropdown */}
                            {contentTypes.length > 1 && (
                              <select
                                value={selectedContentType || contentTypes[0]}
                                onChange={(e) => setResponseContentType(status, e.target.value)}
                                className="text-xs border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-950"
                              >
                                {contentTypes.map(ct => (
                                  <option key={ct} value={ct}>{ct}</option>
                                ))}
                              </select>
                            )}
                          </div>
                          
                          {/* Content based on view mode */}
                          {getResponseViewMode(status) === 'schema' ? (
                            schema && <SwaggerSchema schema={schema as Schema} spec={spec} />
                          ) : (
                            <CodeBlock code={generateExample(schema, selectedContentType || undefined)} contentType={selectedContentType || undefined} />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Validation Error Modal */}
      <Dialog open={showValidationModal} onOpenChange={setShowValidationModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              Validation errors
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {validationErrors.length} error{validationErrors.length !== 1 ? 's' : ''}
            </p>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {validationErrors.map((error, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-sm p-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded"
                >
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <span className="text-red-800 dark:text-red-200">{error}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setShowValidationModal(false)}
              >
                OK
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
