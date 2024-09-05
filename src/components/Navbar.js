"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useSession } from "next-auth/react";
import { IoPersonSharp } from "react-icons/io5";
import { signOut } from "next-auth/react";

function Navbar({ children }) {
	const { data: session } = useSession();
	const pathname = usePathname();

	return (
		<nav className="flex items-center justify-between px-12 py-2 shadow-md">
			<div className="flex w-1/6 flex-row">
				<IoPersonSharp size={24} className="rounded-full" />
				<p className="mx-2 mt-auto">
					<b>{session?.user?.name}</b> ({session?.user?.role})
				</p>
			</div>
			{children}
			<div className="flex justify-end gap-2 w-1/6">
				{session?.user?.role === "manager" && (
					<Link
						href={pathname.startsWith("/staff") ? "/manager" : "/staff"}
						className="float-right cursor-pointer rounded bg-blue-500 px-2 py-1 text-white"
					>
						{pathname.startsWith("/staff") ? "Manager" : "Staff"}
					</Link>
				)}
				<button
					onClick={() => signOut()}
					className="float-right cursor-pointer rounded bg-red-500 px-2 py-1 text-white"
				>
					Sign Out
				</button>
			</div>
		</nav>
	);
}

export default Navbar;
