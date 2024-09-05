"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";

import io from "socket.io-client";

import Modal from "@/components/Modal";

import { fetchData } from "@/lib/utils";
import { IoTrashBin } from "react-icons/io5";

const ordersPage = ({ params }) => {
	const [notifications, setNotifications] = useState([]);

	const [orders, setOrders] = useState([]);
	const [items, setItems] = useState([]);
	const [item, setItem] = useState({});
	const [showHandleOrder, setShowHandleOrder] = useState(false);
	const [showConfirmRemove, setShowConfirmRemove] = useState(false);

	const categories = useMemo(() => Array.from(new Set(items.map((item) => item.category))), [items]);

	const category = useMemo(() => {
		return params.category;
	}, [params.category]);

	const filteredItems = useMemo(() => {
		if (category === "All") {
			return items;
		}
		return items.filter((item) => item.category === category);
	}, [items, category]);

	const pendingItems = useMemo(() => {
		return filteredItems.filter((item) => item.status === "Pending");
	}, [items, category]);

	const ongoingItems = useMemo(() => {
		return filteredItems.filter((item) => item.status === "Ongoing");
	}, [items, category]);

	const completedItems = useMemo(() => {
		return filteredItems.filter((item) => item.status === "Completed");
	}, [orders, category]);

	useEffect(() => {
		const newSocket = io("http://localhost:3000");

		newSocket.on("initialNotifications", (initialNotifications) => {
			setNotifications(initialNotifications);
		});

		newSocket.on("newNotification", (notification) => {
			setNotifications((prev) => [...prev, notification]);
		});

		return () => {
			newSocket.disconnect();
		};
	}, []);

	useEffect(() => {
		const fetchDataAndSetState = async () => {
			try {
				const data = await fetchData("order/staff/pending");

				setOrders(data.orders);

				const updatedOrders = [];

				data.orders.forEach((order) => {
					order.items.forEach((item, index) => {
						const updatedItem = {
							...item,
							id: `${order.id}${String(index + 1).padStart(3, "0")}`,
							orderId: order.id,
							table: order.table,
						};
						updatedOrders.push(updatedItem);
					});
				});

				setItems(updatedOrders);
			} catch (error) {
				console.error("Error fetching orders:", error);
			}
		};

		fetchDataAndSetState();
	}, [notifications]);

	const handleRemove = useCallback(
		async (e) => {
			e.preventDefault();

			try {
				const res = await fetch(`/api/order/${item.table}/${item.orderId}`, {
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ itemId: item._id }),
				});

				if (!res.ok) {
					throw new Error("Failed to delete item");
				}

				setShowConfirmRemove(false);
				setItems((prevItems) => prevItems.filter((i) => i._id !== item._id));
			} catch (error) {
				console.error("Error removing item:", error);
			}
		},
		[items, item]
	);

	const handleAccept = useCallback(
		async (e) => {
			e.preventDefault();

			try {
				const status = item.status === "Pending" ? "Ongoing" : "Completed";

				const res = await fetch("/api/order/staff", {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ id: item.orderId, itemId: item._id, status: status }),
				});

				if (!res.ok) {
					throw new Error("Failed to delete item");
				}

				setShowHandleOrder(false);
				setItems((prevItems) => {
					return prevItems.map((orderItem) => {
						if (orderItem._id === item._id) {
							return { ...orderItem, status: "Ongoing" };
						}
						return orderItem;
					});
				});
			} catch (error) {
				console.error("Error removing item:", error);
			}
		},
		[items, item]
	);

	return (
		<>
			<div className="mb-2 flex justify-between">
				<div className="flex items-center">
					<h1 className="text-2xl font-bold">Orders</h1>
					<p className="mt-0.5">&nbsp;({items.length} orders)</p>
				</div>
				<div className="flex gap-2">
					<Link
						href="/staff/orders/All"
						className={`flex rounded border-2 text-center px-4 py-2 items-center ${category === "All" ? "border-green-500" : ""}`}
					>
						All
					</Link>
					{categories.map((cat) => (
						<Link
							href={`/staff/orders/${cat}`}
							key={cat}
							className={`flex rounded border-2 text-center px-4 py-2 items-center ${cat === category ? "border-green-500" : ""}`}
						>
							{cat}
						</Link>
					))}
				</div>
			</div>
			<div className="grid grid-cols-3 grid-flow-row w-full font-semibold text-lg my-2 text-white">
				<div className="flex justify-center rounded py-2 mx-2 bg-red-500">Pending</div>
				<div className="flex justify-center rounded py-2 mx-2 bg-orange-500">Ongoing</div>
				<div className="flex justify-center rounded py-2 mx-2 bg-green-500">Completed</div>
			</div>
			<div className="grid grid-cols-3 grid-flow-row w-full font-semibold">
				{["Pending", "Ongoing", "Completed"].map((status) => {
					const items =
						status === "Pending" ? pendingItems : status === "Ongoing" ? ongoingItems : completedItems;
					return (
						<div key={status} className="flex flex-col even:border-x-2">
							{items.map((item) => (
								<div
									key={item.name}
									onClick={() => {
										setItem(item);
									}}
									className={`p-4 m-2 rounded ${status === "Pending" ? "bg-red-100" : status === "Ongoing" ? "bg-orange-100" : "bg-green-100"}`}
								>
									<div className="flex justify-between text-xl font-bold">
										<h2>{item.name}</h2>
										<h2>{item.id}</h2>
									</div>
									<div className="flex justify-between">
										<div className="text-sm">
											<p>
												<strong>Size:</strong> {item.size}
											</p>
											<p>
												<strong>Add-Ons:</strong>{" "}
												{item.addOn.length === 0 ? "-" : item.addOn.join(", ")}
											</p>
											<p>
												<strong>Quantity:</strong> {item.quantity}
											</p>
										</div>
										{status !== "Completed" && (
											<div className="flex gap-2 items-end">
												<button
													onClick={() => {
														setShowConfirmRemove(true);
													}}
													className="rounded bg-red-400 h-fit p-3 text-white"
												>
													<IoTrashBin size={24} />
												</button>
												<button
													onClick={() => {
														setShowHandleOrder(true);
													}}
													className="rounded bg-green-500 h-fit py-3 px-6 text-white"
												>
													{status === "Pending" ? "Accept" : "Serve"}
												</button>
											</div>
										)}
									</div>
								</div>
							))}
						</div>
					);
				})}
			</div>
			{showHandleOrder && (
				<Modal
					onClose={() => {
						setShowHandleOrder(false);
					}}
				>
					<form onSubmit={handleAccept} className="rounded p-6">
						<div className="flex justify-between font-bold mb-4 items-end">
							<h2 className="text-3xl">{item.name}</h2>
							<h2 className="text-2xl">{item.id}</h2>
						</div>
						<div className="flex flex-col gap-2 text-xl">
							<p>
								<strong>Size:</strong> {item.size}
							</p>
							<p>
								<strong>Add-Ons:</strong> {item.addOn.length === 0 ? "-" : item.addOn.join(", ")}
							</p>
							<p>
								<strong>Quantity:</strong> {item.quantity}
							</p>
						</div>
						<div className="mt-4 flex justify-end">
							<button
								onClick={() => {
									setShowConfirmRemove(false);
								}}
								className="rounded bg-red-500 p-2 text-white"
							>
								Cancel
							</button>
							<button type="submit" className="ml-2 rounded bg-green-500 p-2 text-white">
								Accept
							</button>
						</div>
					</form>
				</Modal>
			)}
			{showConfirmRemove && (
				<Modal
					onClose={() => {
						setShowConfirmRemove(false);
					}}
				>
					<form onSubmit={handleRemove} className="rounded p-6">
						<div className="flex justify-between font-bold mb-4 items-end">
							<h2 className="text-3xl">{item.name}</h2>
							<h2 className="text-2xl">{item.id}</h2>
						</div>
						<div className="flex flex-col gap-2 text-xl">
							<p>
								<strong>Size:</strong> {item.size}
							</p>
							<p>
								<strong>Add-Ons:</strong> {item.addOn.length === 0 ? "-" : item.addOn.join(", ")}
							</p>
							<p>
								<strong>Quantity:</strong> {item.quantity}
							</p>
						</div>
						<div className="mt-4 flex justify-end">
							<button
								onClick={() => {
									setShowConfirmRemove(false);
								}}
								className="rounded bg-red-500 p-2 text-white"
							>
								Cancel
							</button>
							<button type="submit" className="ml-2 rounded bg-green-500 p-2 text-white">
								Remove
							</button>
						</div>
					</form>
				</Modal>
			)}
		</>
	);
};

export default ordersPage;
