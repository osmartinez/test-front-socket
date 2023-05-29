import { useContext, useEffect } from "react"
import { RoomContext } from "../contexts/RoomContext"
import { Navigate } from "react-router-dom"

export default function LogoutPage() {

    const { userId, logout } = useContext(RoomContext)

    useEffect(() => {
        setTimeout(() => {
            logout()
        }, 2000)
    }, [])

    if (!userId) {
        return <Navigate to="/" replace> </Navigate>
    }
    else {
        return <>
            <h1>Por favor espere mientras cerramos su sesión...</h1>
        </>
    }

}