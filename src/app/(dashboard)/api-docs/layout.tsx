export default function ApiDocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-full flex flex-col lg:flex-row">
      {children}
    </div>
  )
}
