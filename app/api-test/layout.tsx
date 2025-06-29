import type React from "react"
export default function APITestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-orange-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">🧪 API Testing Suite</h1>
          <p className="text-gray-600">Test all Street Eats API endpoints</p>
        </div>
      </div>
      {children}
    </div>
  )
}
