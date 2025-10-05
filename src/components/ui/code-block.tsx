'use client'

import { useState } from 'react'
import { Copy, Check, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useTheme } from 'next-themes'

interface CodeBlockProps {
  code: string
  language?: string
  contentType?: string
  className?: string
  showCopyButton?: boolean
  showDownloadButton?: boolean
  filename?: string
}

// Map content types to syntax highlighter languages
function getLanguageFromContentType(contentType?: string): string {
  if (!contentType) return 'javascript'
  
  const type = contentType.toLowerCase()
  
  if (type.includes('json')) return 'json'
  if (type.includes('xml')) return 'xml'
  if (type.includes('html')) return 'html'
  if (type.includes('yaml') || type.includes('yml')) return 'yaml'
  if (type.includes('css')) return 'css'
  if (type.includes('javascript') || type.includes('js')) return 'javascript'
  if (type.includes('typescript') || type.includes('ts')) return 'typescript'
  if (type.includes('markdown')) return 'markdown'
  if (type.includes('sql')) return 'sql'
  if (type.includes('graphql')) return 'graphql'
  if (type.includes('text/plain')) return 'text'
  
  // Default to text for unknown types
  return 'text'
}

// Format code based on language
function formatCode(code: string, language: string): string {
  if (language === 'json') {
    try {
      const parsed = JSON.parse(code)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return code
    }
  }
  
  // For other languages, return as-is
  return code
}

export default function CodeBlock({ 
  code, 
  language, 
  contentType, 
  className = '',
  showCopyButton = true,
  showDownloadButton = true,
  filename
}: CodeBlockProps) {
  const { theme } = useTheme()
  const [copied, setCopied] = useState(false)
  
  // Determine language from contentType or use provided language
  const detectedLanguage = language || getLanguageFromContentType(contentType)
  
  // Format code if applicable
  const formattedCode = formatCode(code, detectedLanguage)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDownload = () => {
    try {
      // Determine file extension based on language/content type
      let extension = 'txt'
      if (detectedLanguage === 'json') extension = 'json'
      else if (detectedLanguage === 'xml') extension = 'xml'
      else if (detectedLanguage === 'bash') extension = 'sh'
      else if (detectedLanguage === 'javascript') extension = 'js'
      else if (detectedLanguage === 'typescript') extension = 'ts'
      else if (detectedLanguage === 'html') extension = 'html'
      else if (detectedLanguage === 'css') extension = 'css'
      else if (detectedLanguage === 'yaml') extension = 'yaml'
      else if (detectedLanguage === 'sql') extension = 'sql'
      
      const downloadFilename = filename || `code.${extension}`
      
      const blob = new Blob([formattedCode], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = downloadFilename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download:', err)
    }
  }

  return (
    <div className={cn('relative rounded-md border bg-background', className)}>
      {(showCopyButton || showDownloadButton) && (
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          {showCopyButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 w-8 p-0"
              title="Copy to clipboard"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          )}
          {showDownloadButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="h-8 w-8 p-0"
              title="Download file"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
      <div className="max-h-96 overflow-y-auto">
        <SyntaxHighlighter
          language={detectedLanguage}
          style={theme === 'dark' ? vscDarkPlus : vs}
          customStyle={{
            margin: 0,
            padding: '12px',
            fontSize: '12px',
            background: 'transparent',
            borderRadius: '0.375rem',
          }}
          codeTagProps={{
            style: {
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            }
          }}
        >
          {formattedCode}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}
