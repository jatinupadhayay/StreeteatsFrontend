"use client"

import { Suspense } from "react"
import AuthPage from "@/components/common/AuthPage"

export default function AuthPageRoute() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AuthPage />
        </Suspense>
    )
}
