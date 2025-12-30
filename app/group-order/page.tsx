import { Suspense } from "react"
import GroupOrderClient from "./GroupOrderClient"

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <GroupOrderClient />
    </Suspense>
  )
}
