'use client'

import SwaggerViewer from '@/components/swagger/swagger-viewer'

export default function ApiDocsPageClient() {
  return (
    <div className="h-screen flex flex-col">
      <SwaggerViewer initialUrl="https://petstore.swagger.io/v2/swagger.json" />
    </div>
  )
}