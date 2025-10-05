'use client'

import { useState } from 'react'
import { Lock, Key, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import {
  SwaggerSpec,
  OpenAPISpec,
  SecurityScheme,
  isSwagger2,
  isReference,
  resolveReference
} from '@/lib/swagger-types'

export interface AuthCredential {
  value?: string
  username?: string
  password?: string
  token?: string
  [key: string]: string | undefined
}

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  spec: SwaggerSpec | OpenAPISpec
  credentials: Record<string, AuthCredential>
  onCredentialsChange: (credentials: Record<string, AuthCredential>) => void
}

export default function AuthModal({
  open,
  onOpenChange,
  spec,
  credentials,
  onCredentialsChange
}: AuthModalProps) {
  const [localCredentials, setLocalCredentials] = useState<Record<string, AuthCredential>>(credentials)

  // Get security schemes
  const getSecuritySchemes = (): Record<string, SecurityScheme> => {
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

  const handleSave = () => {
    onCredentialsChange(localCredentials)
    onOpenChange(false)
  }

  const handleInputChange = (schemeName: string, field: string, value: string) => {
    setLocalCredentials(prev => ({
      ...prev,
      [schemeName]: {
        ...prev[schemeName],
        [field]: value
      }
    }))
  }

  const handleLogout = (schemeName: string) => {
    setLocalCredentials(prev => {
      const updated = { ...prev }
      delete updated[schemeName]
      return updated
    })
  }

  const getAuthIcon = (type: string) => {
    switch (type) {
      case 'apiKey':
        return <Key className="h-4 w-4" />
      case 'http':
        return <Lock className="h-4 w-4" />
      case 'oauth2':
      case 'openIdConnect':
        return <Shield className="h-4 w-4" />
      default:
        return <Lock className="h-4 w-4" />
    }
  }

  const renderAuthForm = (name: string, scheme: SecurityScheme) => {
    switch (scheme.type) {
      case 'apiKey':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={`${name}-value`}>
                {scheme.name || 'API Key'} 
                {scheme.in && <span className="text-xs text-gray-500 ml-2">({scheme.in})</span>}
              </Label>
              <Input
                id={`${name}-value`}
                type="password"
                placeholder="Enter API key"
                value={localCredentials[name]?.value || ''}
                onChange={(e) => handleInputChange(name, 'value', e.target.value)}
                className="mt-1"
              />
              {scheme.description && (
                <p className="text-xs text-gray-500 mt-1">{scheme.description}</p>
              )}
            </div>
          </div>
        )

      case 'http':
        if (scheme.scheme === 'basic') {
          return (
            <div className="space-y-4">
              <div>
                <Label htmlFor={`${name}-username`}>Username</Label>
                <Input
                  id={`${name}-username`}
                  type="text"
                  placeholder="Enter username"
                  value={localCredentials[name]?.username || ''}
                  onChange={(e) => handleInputChange(name, 'username', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor={`${name}-password`}>Password</Label>
                <Input
                  id={`${name}-password`}
                  type="password"
                  placeholder="Enter password"
                  value={localCredentials[name]?.password || ''}
                  onChange={(e) => handleInputChange(name, 'password', e.target.value)}
                  className="mt-1"
                />
              </div>
              {scheme.description && (
                <p className="text-xs text-gray-500">{scheme.description}</p>
              )}
            </div>
          )
        } else if (scheme.scheme === 'bearer') {
          return (
            <div className="space-y-4">
              <div>
                <Label htmlFor={`${name}-token`}>
                  Bearer Token
                  {scheme.bearerFormat && (
                    <span className="text-xs text-gray-500 ml-2">({scheme.bearerFormat})</span>
                  )}
                </Label>
                <Input
                  id={`${name}-token`}
                  type="password"
                  placeholder="Enter bearer token"
                  value={localCredentials[name]?.token || ''}
                  onChange={(e) => handleInputChange(name, 'token', e.target.value)}
                  className="mt-1"
                />
                {scheme.description && (
                  <p className="text-xs text-gray-500 mt-1">{scheme.description}</p>
                )}
              </div>
            </div>
          )
        }
        break

      case 'oauth2':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
              <p className="text-sm font-medium mb-2">OAuth2 Flow</p>
              {isSwagger2(spec) ? (
                <>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Flow: {scheme.flow}
                  </p>
                  {scheme.authorizationUrl && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Authorization URL: {scheme.authorizationUrl}
                    </p>
                  )}
                  {scheme.tokenUrl && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Token URL: {scheme.tokenUrl}
                    </p>
                  )}
                </>
              ) : (
                <>
                  {scheme.flows?.implicit && (
                    <div className="mb-2">
                      <p className="text-xs font-medium">Implicit Flow</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {scheme.flows.implicit.authorizationUrl}
                      </p>
                    </div>
                  )}
                  {scheme.flows?.authorizationCode && (
                    <div className="mb-2">
                      <p className="text-xs font-medium">Authorization Code Flow</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Auth: {scheme.flows.authorizationCode.authorizationUrl}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Token: {scheme.flows.authorizationCode.tokenUrl}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
            <div>
              <Label htmlFor={`${name}-token`}>Access Token</Label>
              <Input
                id={`${name}-token`}
                type="password"
                placeholder="Enter OAuth2 access token"
                value={localCredentials[name]?.token || ''}
                onChange={(e) => handleInputChange(name, 'token', e.target.value)}
                className="mt-1"
              />
            </div>
            {scheme.description && (
              <p className="text-xs text-gray-500">{scheme.description}</p>
            )}
          </div>
        )

      case 'openIdConnect':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
              <p className="text-sm font-medium mb-2">OpenID Connect</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Discovery URL: {scheme.openIdConnectUrl}
              </p>
            </div>
            <div>
              <Label htmlFor={`${name}-token`}>ID Token</Label>
              <Input
                id={`${name}-token`}
                type="password"
                placeholder="Enter OpenID Connect token"
                value={localCredentials[name]?.token || ''}
                onChange={(e) => handleInputChange(name, 'token', e.target.value)}
                className="mt-1"
              />
            </div>
            {scheme.description && (
              <p className="text-xs text-gray-500">{scheme.description}</p>
            )}
          </div>
        )

      default:
        return <p className="text-sm text-gray-500">Unsupported authentication type</p>
    }
  }

  const hasMultipleSchemes = Object.keys(securitySchemes).length > 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Available Authorizations</DialogTitle>
        </DialogHeader>

        {Object.keys(securitySchemes).length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <Lock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No authorization schemes defined</p>
          </div>
        ) : hasMultipleSchemes ? (
          <Tabs defaultValue={Object.keys(securitySchemes)[0]}>
            <TabsList className="grid grid-cols-auto" style={{ gridTemplateColumns: `repeat(${Object.keys(securitySchemes).length}, minmax(0, 1fr))` }}>
              {Object.entries(securitySchemes).map(([name, scheme]) => (
                <TabsTrigger key={name} value={name} className="flex items-center gap-2">
                  {getAuthIcon(scheme.type)}
                  <span>{name}</span>
                  {localCredentials[name] && (
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            {Object.entries(securitySchemes).map(([name, scheme]) => (
              <TabsContent key={name} value={name} className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "p-2 rounded",
                        localCredentials[name] 
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                      )}>
                        {getAuthIcon(scheme.type)}
                      </div>
                      <div>
                        <h4 className="font-medium">{name}</h4>
                        <p className="text-xs text-gray-500">{scheme.type}</p>
                      </div>
                    </div>
                    {localCredentials[name] && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLogout(name)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Logout
                      </Button>
                    )}
                  </div>
                  {renderAuthForm(name, scheme)}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          Object.entries(securitySchemes).map(([name, scheme]) => (
            <div key={name} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "p-2 rounded",
                    localCredentials[name] 
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                  )}>
                    {getAuthIcon(scheme.type)}
                  </div>
                  <div>
                    <h4 className="font-medium">{name}</h4>
                    <p className="text-xs text-gray-500">{scheme.type}</p>
                  </div>
                </div>
                {localCredentials[name] && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLogout(name)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Logout
                  </Button>
                )}
              </div>
              {renderAuthForm(name, scheme)}
            </div>
          ))
        )}

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Authorize
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
