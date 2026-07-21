'use client'

import React, { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

// Demo credentials pre-filled so a viewer can sign in with one click.
// Override in the deploy env with NEXT_PUBLIC_DEMO_EMAIL / NEXT_PUBLIC_DEMO_PASSWORD.
const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL ?? "demo@sortrack.app"
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? "sortrackdemo"

export default function LoginPage() {
    const [email, setEmail] = useState(DEMO_EMAIL)
    const [password, setPassword] = useState(DEMO_PASSWORD)
    const [errorMsg, setErrorMsg] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    async function handleSubmit(e: React.FormEvent){
        e.preventDefault()
        setErrorMsg("")
        setLoading(true)
        const {data, error} = await supabase.auth.signInWithPassword({email, password});
            if (error){
                setErrorMsg("Email or password is incorrect. Check and try again.")
                setLoading(false)
            } else{
                router.push("/dashboard")
            }

    }


    return(
        <div className="flex min-h-screen items-center justify-center bg-mist px-4">
            <form onSubmit={handleSubmit} className="card w-full max-w-sm p-8">
                <div className="mb-6">
                    <div className="text-2xl font-semibold text-ink-deep">S.Track</div>
                    <div className="mt-2 border-t-2 border-ink" />
                    <div className="mt-[2px] border-t border-rule" />
                    <p className="mt-2 text-xs text-mute">Materials Procurement &amp; Inventory</p>
                </div>

                <div className="mb-4 rounded-md border border-ink/30 bg-ink-soft px-3 py-2 text-xs text-ink-deep">
                    Demo account is pre-filled. Just click Sign in.
                </div>

                <div className="mb-4">
                    <label htmlFor="email" className="mb-1 block text-sm text-mute">Email</label>
                    <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="field"
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="password" className="mb-1 block text-sm text-mute">Password</label>
                    <input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="field"
                    />
                </div>

                {errorMsg && (
                    <p role="alert" className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {errorMsg}
                    </p>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full">
                    {loading ? "Signing in..." : "Sign in"}
                </button>
            </form>
        </div>
    )
}
