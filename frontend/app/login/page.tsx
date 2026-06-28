'use client'

import React, { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const router = useRouter()
    async function handleSubmit(e: React.FormEvent){
        e.preventDefault()
        // TODO(user): call supabase.auth.signInWithPassword here
        const {data, error} = await supabase.auth.signInWithPassword({email, password});    
            if (error){
                alert("Wrong Credentials")
            } else{
                alert("./dashboard")
            }

    }


    return(
        <form onSubmit={handleSubmit}>
            {/* TODO(user): add email input, password input, and submit button */}
            <input type="email" placeholder ="Email" value={email} onChange={(e) => setEmail(e.target.value)}></input>
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}></input>
            <button type="submit">Login</button>
        </form>

    )
}