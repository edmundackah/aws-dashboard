'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, FileJson, AlertCircle, Lock, Unlock, Upload } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import SwaggerInfo from './swagger-info'
import SwaggerEndpoint from './swagger-endpoint'
import AuthModal, { AuthCredential } from './auth-modal'
import { SwaggerSpec, OpenAPISpec, Operation, Schema, isSwagger2, isOpenAPI3, isReference, resolveReference } from '@/lib/swagger-types'
import SwaggerSchema from './swagger-schema'
import CodeBlock from '@/components/ui/code-block'
import { cn } from '@/lib/utils'

interface SwaggerViewerProps {
  initialUrl?: string
}

export default function SwaggerViewer({ initialUrl }: SwaggerViewerProps) {
  const [url, setUrl] = useState(initialUrl || 'https://petstore.swagger.io/v2/swagger.json')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [spec, setSpec] = useState<SwaggerSpec | OpenAPISpec | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authCredentials, setAuthCredentials] = useState<Record<string, AuthCredential>>({})
  const [selectedServer, setSelectedServer] = useState<string | null>(null)
  const [modelViewMode, setModelViewMode] = useState<Record<string, 'schema' | 'example'>>({})
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  const toggleModelView = (modelName: string) => {
    setModelViewMode(prev => ({
      ...prev,
      [modelName]: prev[modelName] === 'example' ? 'schema' : 'example'
    }))
  }
  
  const generateArrayItemExample = (itemSchema: Schema): unknown => {
    if (itemSchema.example !== undefined) {
      return itemSchema.example
    }
    if (itemSchema.default !== undefined) {
      return itemSchema.default
    }
    
    switch (itemSchema.type) {
      case 'string':
        return itemSchema.enum ? itemSchema.enum[0] : 'string'
      case 'integer':
      case 'number':
        return 0
      case 'boolean':
        return true
      case 'array':
        return []
      case 'object':
        if (itemSchema.properties) {
          const obj: Record<string, unknown> = {}
          Object.entries(itemSchema.properties).forEach(([key, prop]) => {
            const propSchema = isReference(prop) 
              ? resolveReference(prop.$ref, spec!) as Schema
              : prop as Schema
            obj[key] = generateArrayItemExample(propSchema)
          })
          return obj
        }
        return {}
      default:
        return null
    }
  }

  const generateModelExample = (schema: Schema): string => {
    if (schema.example !== undefined) {
      return JSON.stringify(schema.example, null, 2)
    }
    
    // Generate example based on type
    if (schema.type === 'object' && schema.properties) {
      const example: Record<string, unknown> = {}
      Object.entries(schema.properties).forEach(([key, prop]) => {
        const propSchema = isReference(prop) 
          ? resolveReference(prop.$ref, spec!) as Schema
          : prop as Schema
        
        if (propSchema.example !== undefined) {
          example[key] = propSchema.example
        } else if (propSchema.default !== undefined) {
          example[key] = propSchema.default
        } else {
          switch (propSchema.type) {
            case 'string':
              example[key] = propSchema.enum ? propSchema.enum[0] : 'string'
              break
            case 'integer':
            case 'number':
              example[key] = 0
              break
            case 'boolean':
              example[key] = true
              break
            case 'array':
              // Generate meaningful array examples
              if (propSchema.items) {
                const itemSchema = isReference(propSchema.items)
                  ? resolveReference(propSchema.items.$ref, spec!) as Schema
                  : propSchema.items as Schema
                
                // Generate 2-3 example items for arrays
                const examples = []
                for (let i = 0; i < Math.min(3, propSchema.maxItems || 3); i++) {
                  examples.push(generateArrayItemExample(itemSchema))
                }
                example[key] = examples
              } else {
                example[key] = []
              }
              break
            case 'object':
              example[key] = {}
              break
            default:
              example[key] = null
          }
        }
      })
      return JSON.stringify(example, null, 2)
    }
    
    if (schema.type === 'array') {
      // Generate meaningful array examples
      if (schema.items) {
        const itemSchema = isReference(schema.items)
          ? resolveReference(schema.items.$ref, spec!) as Schema
          : schema.items as Schema
        
        // Generate 2-3 example items for arrays
        const examples = []
        for (let i = 0; i < Math.min(3, schema.maxItems || 3); i++) {
          examples.push(generateArrayItemExample(itemSchema))
        }
        return JSON.stringify(examples, null, 2)
      }
      return '[]'
    }
    
    return JSON.stringify(null, null, 2)
  }

  const loadSwaggerSpec = async (data?: any) => {
    setLoading(true)
    setError(null)
    
    try {
      let specData = data
      
      // If no data provided, fetch from URL
      if (!specData) {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`)
        }
        specData = await response.json()
      }
      
      // Validate it's a valid Swagger/OpenAPI spec
      if (!isSwagger2(specData) && !isOpenAPI3(specData)) {
        throw new Error('Invalid Swagger/OpenAPI specification')
      }
      
      setSpec(specData)
      
      // Set default server
      if (isSwagger2(specData)) {
        // For Swagger 2.0, construct the base URL
        const scheme = specData.schemes?.[0] || 'https'
        const host = specData.host || 'localhost'
        const basePath = specData.basePath || ''
        setSelectedServer(`${scheme}://${host}${basePath}`)
      } else {
        // For OpenAPI 3.x, use the first server
        setSelectedServer(specData.servers?.[0]?.url || 'https://api.example.com')
      }
      
      // Select first tag by default
      if (specData.tags && specData.tags.length > 0) {
        setSelectedTag(specData.tags[0].name)
      } else {
        setSelectedTag(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load specification')
      setSpec(null)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    setSelectedFile(file)
    setLoading(true)
    setError(null)
    
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      await loadSwaggerSpec(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file')
      setSpec(null)
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  useEffect(() => {
    if (url) {
      loadSwaggerSpec()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLoadSpec = (e: React.FormEvent) => {
    e.preventDefault()
    loadSwaggerSpec()
  }

  // Group endpoints by tag
  const groupEndpointsByTag = () => {
    if (!spec) return {}
    
    const grouped: Record<string, Array<{ path: string; method: string; operation: Operation }>> = {}
    
    Object.entries(spec.paths).forEach(([path, pathItem]) => {
      Object.entries(pathItem).forEach(([method, operation]) => {
        if (typeof operation === 'object' && 'tags' in operation && !method.startsWith('$')) {
          const operationTyped = operation as Operation
          const tags = operationTyped.tags || ['default']
          tags.forEach((tag: string) => {
            if (!grouped[tag]) {
              grouped[tag] = []
            }
            grouped[tag].push({ path, method, operation: operationTyped })
          })
        }
      })
    })
    
    return grouped
  }

  // Get all models/schemas
  const getModels = () => {
    if (!spec) return {}
    
    if (isSwagger2(spec)) {
      return spec.definitions || {}
    } else {
      return spec.components?.schemas || {}
    }
  }

  const groupedEndpoints = groupEndpointsByTag()
  const models = getModels()
  const availableTags = spec?.tags || Object.keys(groupedEndpoints).map(tag => ({ name: tag, description: '' }))
  
  // Check if spec has any security schemes
  const hasSecuritySchemes = spec && (
    (isSwagger2(spec) && spec.securityDefinitions && Object.keys(spec.securityDefinitions).length > 0) ||
    (!isSwagger2(spec) && spec.components?.securitySchemes && Object.keys(spec.components.securitySchemes).length > 0)
  )
  
  // Count authenticated schemes
  const authenticatedCount = Object.keys(authCredentials).length

  return (
    <div className="h-full flex flex-col">
      {/* URL Input and File Upload */}
      <div className="border-b border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-950">
        <div className="space-y-4">
          {/* URL Input */}
          <form onSubmit={handleLoadSpec} className="flex gap-2">
            <div className="flex-1 relative">
              <FileJson className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter Swagger/OpenAPI JSON URL..."
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load from URL'
              )}
            </Button>
          </form>

          {/* File Upload */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="file"
                id="swagger-file"
                accept=".json"
                onChange={handleFileChange}
                disabled={loading}
                className="sr-only"
              />
              <label
                htmlFor="swagger-file"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm border rounded-md cursor-pointer transition-colors max-w-md",
                  loading
                    ? "border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 cursor-not-allowed opacity-60"
                    : "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 hover:border-primary"
                )}
              >
                <Upload className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-300">
                  {selectedFile ? selectedFile.name : 'Choose JSON file...'}
                </span>
              </label>
            </div>
            {selectedFile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedFile(null)
                  const fileInput = document.getElementById('swagger-file') as HTMLInputElement
                  if (fileInput) fileInput.value = ''
                }}
                disabled={loading}
              >
                Clear
              </Button>
            )}
          </div>
          
          {/* Base URL selector and Authorize button */}
          {spec && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">Base URL:</span>
                {(() => {
                  const servers = isSwagger2(spec) 
                    ? spec.schemes?.map(scheme => ({
                        url: `${scheme}://${spec.host || 'localhost'}${spec.basePath || ''}`,
                        description: `${scheme.toUpperCase()} Protocol`
                      })) || []
                    : spec.servers || []
                  
                  if (servers.length > 1) {
                    return (
                      <Select value={selectedServer || ''} onValueChange={setSelectedServer}>
                        <SelectTrigger className="flex-1 font-mono">
                          <SelectValue placeholder="Select server..." />
                        </SelectTrigger>
                        <SelectContent>
                          {servers.map((server, index) => (
                            <SelectItem key={index} value={server.url}>
                              {server.url}{server.description ? ` (${server.description})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )
                  } else {
                    // Single server, show as read-only text
                    const defaultUrl = isSwagger2(spec)
                      ? `${spec.schemes?.[0] || 'https'}://${spec.host || 'localhost'}${spec.basePath || ''}`
                      : spec.servers?.[0]?.url || 'https://api.example.com'
                    return (
                      <code className="text-sm bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded font-mono">
                        {selectedServer || defaultUrl}
                      </code>
                    )
                  }
                })()}
              </div>
              
              {/* Authorize button */}
              {hasSecuritySchemes && (
                <Button
                  variant={authenticatedCount > 0 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAuthModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  {authenticatedCount > 0 ? (
                    <>
                      <Unlock className="h-4 w-4" />
                      Authorized ({authenticatedCount})
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      Authorize
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
        
        {error && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      {spec && (
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <aside className="w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-y-auto">
            <div className="p-4">
              <SwaggerInfo spec={spec} />
              
              {/* Tags */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Tags</h3>
                <div className="space-y-1">
                  {availableTags.map((tag) => (
                    <button
                      key={tag.name}
                      onClick={() => setSelectedTag(tag.name)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedTag === tag.name
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="font-medium">{tag.name}</div>
                      {tag.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {tag.description}
                        </div>
                      )}
                    </button>
                  ))}
                  
                  {/* Models Section */}
                  {Object.keys(models).length > 0 && (
                    <button
                      onClick={() => setSelectedTag('__models__')}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedTag === '__models__'
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="font-medium">Models</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {Object.keys(models).length} schema{Object.keys(models).length !== 1 ? 's' : ''}
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <div className="p-6">
              {selectedTag === '__models__' ? (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold">Models</h2>
                  <div className="space-y-4">
                    {Object.entries(models).map(([name, schemaOrRef]) => {
                      const schema = isReference(schemaOrRef)
                        ? resolveReference(schemaOrRef.$ref, spec) as Schema
                        : schemaOrRef as Schema
                      
                      return (
                        <div
                          key={name}
                          className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden"
                        >
                          <div className="bg-gray-100 dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                  {name}
                                </h3>
                                <span className="text-xs bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">
                                  {schema.type || 'object'}
                                </span>
                              </div>
                              
                              {/* Toggle buttons */}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleModelView(name)}
                                  className={`text-xs px-2 py-1 rounded transition-colors ${
                                    (modelViewMode[name] || 'schema') === 'schema'
                                      ? 'bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
                                  }`}
                                >
                                  Schema
                                </button>
                                <button
                                  onClick={() => toggleModelView(name)}
                                  className={`text-xs px-2 py-1 rounded transition-colors ${
                                    modelViewMode[name] === 'example'
                                      ? 'bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
                                  }`}
                                >
                                  Example
                                </button>
                              </div>
                            </div>
                            {schema.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {schema.description}
                              </p>
                            )}
                          </div>
                          <div className="p-4">
                          {(modelViewMode[name] || 'schema') === 'schema' ? (
                            <SwaggerSchema schema={schema} spec={spec} />
                          ) : (
                            <CodeBlock code={generateModelExample(schema)} language="json" />
                          )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : selectedTag && groupedEndpoints[selectedTag] ? (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold">{selectedTag}</h2>
                  {groupedEndpoints[selectedTag].map((endpoint, index) => (
                    <SwaggerEndpoint
                      key={`${endpoint.path}-${endpoint.method}-${index}`}
                      path={endpoint.path}
                      method={endpoint.method}
                      operation={endpoint.operation}
                      spec={spec}
                      authCredentials={authCredentials}
                      selectedServer={selectedServer}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  Select a tag to view endpoints
                </div>
              )}
            </div>
          </main>
        </div>
      )}
      
      {/* Auth Modal */}
      {spec && (
        <AuthModal
          open={authModalOpen}
          onOpenChange={setAuthModalOpen}
          spec={spec}
          credentials={authCredentials}
          onCredentialsChange={setAuthCredentials}
        />
      )}
    </div>
  )
}
