"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";

import { update } from "./action";

import Navbar from "@/components/Navbar";
import Modal from "@/components/Modal";
import Store from "@/store.json";

export default function Layout({ children }) {
	const [showHandleStore, setShowHandleStore] = useState(false);
	const [store, setStore] = useState(Store);

	const handleChange = useCallback((e) => {
		const { name, value } = e.target;
		setStore((prevItem) => ({ ...prevItem, [name]: value }));
	}, []);

	const formSubmit = useCallback(
		(e) => {
			e.preventDefault();
			update(store);
			setShowHandleStore(false);
		},
		[store]
	);

	return (
		<>
			<Navbar>
				<ul className="flex space-x-10 font-bold">
					<li className="cursor-pointer">
						<Link href="/manager">Home</Link>
					</li>
					<li className="cursor-pointer">
						<Link href="/manager/staffs">Staff</Link>
					</li>
					<li className="cursor-pointer">
						<button onClick={() => setShowHandleStore(true)}>Store</button>
					</li>
				</ul>
			</Navbar>
			<div className="flex grow flex-col px-12 py-6">{children}</div>
			{showHandleStore && (
				<Modal
					onClose={() => {
						setShowHandleStore(false);
					}}
				>
					<form onSubmit={formSubmit} className="flex flex-col gap-2 rounded p-6">
						<div className="flex justify-between">
							<h2 className="text-xl font-bold">Store</h2>
						</div>
						{["name", "address", "tel"].map((field) => (
							<div key={field} className="flex flex-col">
								<label className="mb-1 font-semibold">
									{field.charAt(0).toUpperCase() + field.slice(1)}
								</label>
								<input
									type="text"
									name={field}
									value={store[field]}
									onChange={handleChange}
									placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
									className="rounded border bg-gray-100 p-2"
									required
								/>
							</div>
						))}
						<div className="mt-4 flex justify-end">
							<button
								onClick={() => {
									setShowHandleStore(false);
								}}
								className="rounded bg-red-500 p-2 text-white"
							>
								Cancel
							</button>
							<button type="submit" className="ml-2 rounded bg-green-500 p-2 text-white">
								Edit
							</button>
						</div>
					</form>
				</Modal>
			)}
		</>
	);
}
