"use client";

import React, { useEffect, useState } from "react";

import { signIn } from "next-auth/react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

import Container from "../components/Container";
import Footer from "../components/Footer";

export default function LoginPage() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");

	const { data: session } = useSession();
	useEffect(() => {
		if (session?.user?.role === "manager") {
			redirect("manager");
		} else if (session?.user?.role === "cashier") {
			redirect("staff");
		}
	}, [session]);

	const formSubmit = async (e) => {
		e.preventDefault();

		try {
			const res = await signIn("credentials", {
				username,
				password,
				redirect: false,
			});

			if (res.error) {
				console.log("Invalid credentials");
				return;
			}

			if (session?.user?.role === "manager") {
				redirect("manager");
			} else if (session?.user?.role === "cashier") {
				redirect("staff");
			}
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<Container>
			<div className="m-auto w-1/3 p-6">
				<h1 className="mb-6 text-center text-4xl font-bold">POS</h1>
				<div className="rounded-b-lg p-6 shadow-xl">
					<h2 className="mb-6 text-center text-3xl font-bold">Login</h2>
					<form className="flex flex-col" onSubmit={formSubmit}>
						<div className="mb-2">
							<label className="text-lg">Username</label>
							<input
								type="text"
								className="my-2 w-full rounded border bg-gray-100 px-3 py-2 text-lg"
								name="username"
								placeholder="Enter Username"
								onChange={(e) => setUsername(e.target.value)}
								required
							/>
						</div>
						<div className="mb-2">
							<label className="text-lg">Password</label>
							<input
								type="password"
								className="my-2 w-full rounded border bg-gray-100 px-3 py-2 text-lg"
								name="password"
								placeholder="Enter Password"
								onChange={(e) => setPassword(e.target.value)}
								required
							/>
						</div>
						<input
							type="submit"
							className="mt-2 cursor-pointer rounded bg-green-500 py-2 text-white"
							value="Login"
						/>
					</form>
				</div>
			</div>
			<Footer />
		</Container>
	);
}
