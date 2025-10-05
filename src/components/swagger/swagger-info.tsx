'use client'

import { SwaggerSpec, OpenAPISpec, SecurityScheme, isSwagger2, isReference, resolveReference } from '@/lib/swagger-types'
import { Globe, Mail, FileText, Shield } from 'lucide-react'

interface SwaggerInfoProps {
  spec: SwaggerSpec | OpenAPISpec
}

export default function SwaggerInfo({ spec }: SwaggerInfoProps) {
  const { info } = spec
  const version = isSwagger2(spec) ? 'Swagger 2.0' : `OpenAPI ${spec.openapi}`
  
  const baseUrl = isSwagger2(spec) 
    ? `${spec.schemes?.[0] || 'https'}://${spec.host || 'localhost'}${spec.basePath || ''}`
    : spec.servers?.[0]?.url || 'https://api.example.com'

  return (
    <div className="space-y-4">
      {/* Title and Version */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {info.title}
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
            v{info.version}
          </span>
          <span className="text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
            {version}
          </span>
        </div>
      </div>

      {/* Description */}
      {info.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {info.description}
        </p>
      )}

      {/* Base URL */}
      <div className="flex items-start gap-2">
        <Globe className="h-4 w-4 text-gray-400 mt-0.5" />
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Base URL</p>
          <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded font-mono">
            {baseUrl}
          </code>
        </div>
      </div>

      {/* Contact */}
      {info.contact && (
        <div className="flex items-start gap-2">
          <Mail className="h-4 w-4 text-gray-400 mt-0.5" />
          <div className="text-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">Contact</p>
            {info.contact.name && (
              <p className="text-gray-700 dark:text-gray-300">{info.contact.name}</p>
            )}
            {info.contact.email && (
              <a
                href={`mailto:${info.contact.email}`}
                className="text-primary hover:underline"
              >
                {info.contact.email}
              </a>
            )}
            {info.contact.url && (
              <a
                href={info.contact.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline block"
              >
                {info.contact.url}
              </a>
            )}
          </div>
        </div>
      )}

      {/* License */}
      {info.license && (
        <div className="flex items-start gap-2">
          <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
          <div className="text-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">License</p>
            {info.license.url ? (
              <a
                href={info.license.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {info.license.name}
              </a>
            ) : (
              <p className="text-gray-700 dark:text-gray-300">{info.license.name}</p>
            )}
          </div>
        </div>
      )}

      {/* Terms of Service */}
      {info.termsOfService && (
        <div className="flex items-start gap-2">
          <Shield className="h-4 w-4 text-gray-400 mt-0.5" />
          <div className="text-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">Terms of Service</p>
            <a
              href={info.termsOfService}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              View Terms
            </a>
          </div>
        </div>
      )}

      {/* Security Schemes */}
      {isSwagger2(spec) && spec.securityDefinitions && Object.keys(spec.securityDefinitions).length > 0 && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Security Schemes
          </h3>
          <div className="space-y-2">
            {Object.entries(spec.securityDefinitions).map(([name, scheme]) => (
              <div key={name} className="text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-gray-400" />
                  <span className="font-medium text-gray-700 dark:text-gray-300">{name}</span>
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                    {scheme.type}
                  </span>
                </div>
                {scheme.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 ml-5 mt-0.5">
                    {scheme.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* OpenAPI 3.x Security Schemes */}
      {!isSwagger2(spec) && spec.components?.securitySchemes && Object.keys(spec.components.securitySchemes).length > 0 && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Security Schemes
          </h3>
          <div className="space-y-2">
            {Object.entries(spec.components.securitySchemes).map(([name, schemeOrRef]) => {
              const scheme = isReference(schemeOrRef) 
                ? resolveReference(schemeOrRef.$ref, spec) as SecurityScheme
                : schemeOrRef
              return (
                <div key={name} className="text-sm">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3 text-gray-400" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">{name}</span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                      {scheme.type}
                    </span>
                  </div>
                  {scheme.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 ml-5 mt-0.5">
                      {scheme.description}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
