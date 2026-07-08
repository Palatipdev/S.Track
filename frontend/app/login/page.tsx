'use client'

import React, { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [errorMsg, setErrorMsg] = useState("")
    const router = useRouter()
    async function handleSubmit(e: React.FormEvent){
        e.preventDefault()
        setErrorMsg("")
        const {data, error} = await supabase.auth.signInWithPassword({email, password});
            if (error){
                setErrorMsg("Email or password is incorrect. Check and try again.")
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
                    <p className="mt-2 text-xs text-mute">ระบบติดตามวัสดุ ส.บุญมีฤทธิ์วิศวกรรม</p>
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

                <button type="submit" className="btn-primary w-full">Sign in</button>
            </form>
        </div>
    )
}
