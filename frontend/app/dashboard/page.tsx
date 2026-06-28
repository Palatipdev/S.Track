"use client"
import { supabase } from "@/lib/supabase"
import { useState } from "react"
import { useEffect } from "react"

export default function dashboardPage() {

    const [requests, setRequests] = useState<any[]>([])

    const getSupabaseToken = async () => {
        // fetching the current session
        const {data, error} = await supabase.auth.getSession()

        if (error || !data.session){
            console.error("No active session found", error)
            return null;
        }
        const token = data.session.access_token
        return token
    }

    useEffect (() =>
    {
        async function fetchData(){
            const token = await getSupabaseToken()
            if (!token){
                console.error("No token found")
                return null
            }
            
            const response = await fetch(`http://localhost:8000/material-requests`,{
                headers: {Authorization: `Bearer ${token}`},
                method: "GET"
            })

            const data = await response.json()
            setRequests(data)
        }
        fetchData();
    },
    [])

    return(
        <div>
            <h2>Material Requests:</h2>
            <ul>
                {requests.map((req,idx) => (
                    <li key={req.id}>{req.project_id} — {req.status} — {req.urgency}</li>
                ))}
            </ul>
        </div>
    )
}