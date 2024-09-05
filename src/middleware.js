import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req) {
	const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
	const { pathname } = req.nextUrl;

	if (!token) {
		return NextResponse.redirect(new URL("/", req.url));
	} else if (pathname.startsWith("/manager") && token.role !== "manager") {
		return NextResponse.redirect(new URL("/staff", req.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/manager/:path*", "/staff/:path*", "/:path*/items"],
};
