'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Schema,
  SwaggerSpec,
  OpenAPISpec,
  isReference,
  resolveReference
} from '@/lib/swagger-types'

interface SwaggerSchemaProps {
  schema?: Schema | { $ref: string }
  spec: SwaggerSpec | OpenAPISpec
  depth?: number
  name?: string
  required?: boolean
}

export default function SwaggerSchema({
  schema,
  spec,
  depth = 0,
  name,
  required = false
}: SwaggerSchemaProps) {
  const [expanded, setExpanded] = useState(depth < 2)

  if (!schema) return null

  // Resolve reference if needed
  const resolvedSchema = isReference(schema)
    ? resolveReference(schema.$ref, spec) as Schema
    : schema

  const hasChildren = resolvedSchema.properties || resolvedSchema.items

  const getTypeDisplay = (schema: Schema): string => {
    if (schema.type === 'array' && schema.items) {
      const itemType = isReference(schema.items)
        ? getRefName(schema.items.$ref)
        : schema.items.type || 'object'
      return `array[${itemType}]`
    }
    if (schema.$ref) {
      return getRefName(schema.$ref)
    }
    return schema.type || 'object'
  }

  const getRefName = (ref: string): string => {
    const parts = ref.split('/')
    return parts[parts.length - 1]
  }

  return (
    <div className="relative">
      {/* Property header */}
      <div className="flex items-center gap-2">
        {hasChildren && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          >
            {expanded ? (
              <ChevronDown className="h-3 w-3 text-gray-500" />
            ) : (
              <ChevronRight className="h-3 w-3 text-gray-500" />
            )}
          </button>
        )}
        
        {name && (
          <>
            <span className="font-mono text-xs text-primary">{name}</span>
            <span className="text-xs text-gray-500">{getTypeDisplay(resolvedSchema)}</span>
            {required && <span className="text-xs text-red-600 dark:text-red-400">required</span>}
          </>
        )}
        
        {!name && (
          <span className="text-xs text-gray-500">{getTypeDisplay(resolvedSchema)}</span>
        )}
        
        {resolvedSchema.description && (
          <span className="text-xs text-gray-500">- {resolvedSchema.description}</span>
        )}
      </div>

      {/* Nested properties */}
      {hasChildren && expanded && (
        <div className={cn('mt-1', depth > 0 && 'ml-4 pl-2 border-l border-gray-200 dark:border-gray-800')}>
          {/* Object properties */}
          {resolvedSchema.properties && (
            <div className="space-y-1">
              {Object.entries(resolvedSchema.properties).map(([propName, propSchema]) => (
                <SwaggerSchema
                  key={propName}
                  name={propName}
                  schema={propSchema}
                  spec={spec}
                  depth={depth + 1}
                  required={resolvedSchema.required?.includes(propName)}
                />
              ))}
            </div>
          )}

          {/* Array items */}
          {resolvedSchema.items && (
            <SwaggerSchema
              schema={resolvedSchema.items}
              spec={spec}
              depth={depth + 1}
            />
          )}
        </div>
      )}

      {/* Enum values */}
      {resolvedSchema.enum && (
        <div className="mt-1 ml-6">
          <span className="text-xs text-gray-500">Enum: </span>
          <span className="text-xs font-mono">
            [{resolvedSchema.enum.map(v => JSON.stringify(v)).join(', ')}]
          </span>
        </div>
      )}

      {/* Format */}
      {resolvedSchema.format && (
        <div className="mt-1 ml-6">
          <span className="text-xs text-gray-500">Format: </span>
          <span className="text-xs font-mono">{resolvedSchema.format}</span>
        </div>
      )}

      {/* Example */}
      {resolvedSchema.example !== undefined && (
        <div className="mt-1 ml-6">
          <span className="text-xs text-gray-500">Example: </span>
          <span className="text-xs font-mono">
            {typeof resolvedSchema.example === 'string'
              ? resolvedSchema.example
              : JSON.stringify(resolvedSchema.example)}
          </span>
        </div>
      )}
    </div>
  )
}
