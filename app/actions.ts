"use server"

import { lucia, validateRequest } from "@/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function SignOut() {

    const { session } = await validateRequest()
  
    if(!session){
      throw new Error("Unauthorized")
    }
    await lucia.invalidateSession(session.id)
  
    const sessionCookie = lucia.createBlankSessionCookie()
    ;(await cookies()).set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    )
    redirect("/sign-in")
  }
  