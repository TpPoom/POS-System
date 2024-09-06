"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import io from "socket.io-client";
import Image from "next/image";

import Modal from "@/components/Modal";
import Store from "@/store.json";
import jsPDF from "jspdf";
import "jspdf-autotable";

import { IoTrashBin } from "react-icons/io5";
import { fetchData } from "@/lib/utils";

const TabledPage = () => {
	const [socket, setSocket] = useState(null);
	const [notifications, setNotifications] = useState([]);

	const [id, setId] = useState("");
	const [tables, setTables] = useState([]);
	const [table, setTable] = useState({});
	const [orders, setOrders] = useState([]);
	const [item, setItem] = useState({});
	const [showHandleTable, setShowHandleTable] = useState(false);
	const [showHandleOrder, setShowHandleOrder] = useState(false);
	const [showConfirmRemove, setShowConfirmRemove] = useState(false);

	useEffect(() => {
		const newSocket = io("http://localhost:3000");
		setSocket(newSocket);

		newSocket.on("initialNotifications", (initialNotifications) => {
			setNotifications(initialNotifications);
		});

		newSocket.on("newNotification", (notification) => {
			setNotifications((prev) => [...prev, notification]);
		});

		newSocket.on("deleteNotification", (id) => {
			setNotifications((prev) => prev.filter((n) => n.id !== id));
		});

		return () => {
			newSocket.disconnect();
		};
	}, []);

	useEffect(() => {
		const fetchDataAndSetState = async () => {
			try {
				const [tablesData, ordersData] = await Promise.all([
					fetchData("table"),
					fetchData("order/staff/pending"),
				]);

				const lastId = String(parseInt(ordersData.lastId) + 1).padStart(6, "0") || "000001";
				setId(lastId);

				const updatedOrders = ordersData.orders.map((order) => {
					const updatedTotal = order.items.reduce((total, item) => total + item.price * item.quantity, 0);
					return { ...order, total: updatedTotal };
				});

				const updatedTables = tablesData.map((table) => {
					const hasOrder = ordersData.orders.some((order) => order.table === table.name);
					return { ...table, status: hasOrder ? "Unavailable" : "Available" };
				});

				setOrders(updatedOrders);
				setTables(updatedTables);
			} catch (error) {
				console.error("Failed to fetch data");
			}
		};

		fetchDataAndSetState();
	}, [notifications]);

	const deleteNotification = (id) => {
		if (socket) {
			socket.emit("deleteNotification", id);
		}
	};

	const selectedOrder = useMemo(() => orders.find((order) => order.table === table.name) || {}, [orders, table]);

	const handleConfirmRemove = useCallback((e, item) => {
		e.preventDefault();

		setItem(item);
		setShowConfirmRemove(true);
	}, []);

	const handleRemoveItem = useCallback(
		async (e) => {
			e.preventDefault();
			setShowConfirmRemove(false);

			try {
				const res = await fetch(`/api/order/${selectedOrder.table}/${selectedOrder.id}`, {
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ itemId: item._id }),
				});

				if (!res.ok) {
					throw new Error("Failed to delete item");
				}

				setOrders((prevOrders) => {
					return prevOrders.map((o) => {
						if (o.id === selectedOrder.id) {
							const updatedItems = o.items.filter((i) => i._id !== item._id);
							const newTotal = updatedItems.reduce(
								(total, item) => total + item.price * item.quantity,
								0
							);

							return { ...o, items: updatedItems, total: newTotal };
						}
						return o;
					});
				});
			} catch (error) {
				console.error("Error removing item:", error);
			}
		},
		[item, selectedOrder]
	);

	const createTablePDF = useCallback(() => {
		const doc = new jsPDF({
			unit: "mm",
			format: [80, 120],
		});

		doc.setFont("Courier");
		let yPos = 10;
		const leftMargin = 5;
		const lineHeight = 5;

		doc.setFontSize(14);
		doc.text("ORDER", 40, yPos, { align: "center" });
		yPos += lineHeight * 1.5;
		doc.setFontSize(10);
		doc.text(Store.name, 40, yPos, { align: "center" });
		yPos += lineHeight;
		doc.text(Store.address, 40, yPos, { align: "center" });
		yPos += lineHeight;
		doc.text(`Tel ${Store.tel}`, 40, yPos, { align: "center" });
		yPos += lineHeight * 1.5;
		doc.text(new Date().toUTCString().slice(5, 25), leftMargin, yPos);
		doc.text(`TABLE: ${table.name}`, 75, yPos, { align: "right" });
		yPos += lineHeight / 2;
		doc.text("_________________________________", leftMargin, yPos);
		yPos += lineHeight * 2;
		doc.addImage(
			`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${window.location.origin}/order/${table.name}/${id}`,
			"JPG",
			10,
			yPos,
			60,
			60
		);

		doc.autoPrint();
		doc.close();
		document.getElementById("pdf").src = doc.output("datauristring");
	}, [table, id]);

	const tableSubmit = useCallback(
		async (e) => {
			e.preventDefault();
			setShowHandleTable(false);

			try {
				const res = await fetch(`/api/order/${table.name}/${id}`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
				});

				if (res.ok) {
					createTablePDF();
					setTables((prevTables) =>
						prevTables.map((t) => (t.id === table.id ? { ...table, status: "Unavailable" } : t))
					);
					setOrders((prevOrders) => [
						...prevOrders,
						{ id, items: [], table: table.name, total: 0, status: "Pending" },
					]);
					setId(String(parseInt(id) + 1).padStart(6, "0"));
				} else {
					console.error("Failed to save table");
				}
			} catch (error) {
				console.error("Error:", error);
			}
		},
		[createTablePDF, id, table]
	);

	const createBillPDF = useCallback(() => {
		const doc = new jsPDF({
			unit: "mm",
			format: [80, 120],
		});

		doc.setFont("Courier");
		let yPos = 10;
		const leftMargin = 5;
		const lineHeight = 5;

		doc.setFontSize(14);
		doc.text("RECEIPT", 40, yPos, { align: "center" });
		yPos += lineHeight * 1.5;
		doc.setFontSize(10);
		doc.text("SUPERMARKET LTD", 40, yPos, { align: "center" });
		yPos += lineHeight;
		doc.text("PLANET EARTH", 40, yPos, { align: "center" });
		yPos += lineHeight;
		doc.text("Tel 1234-456-7890", 40, yPos, { align: "center" });
		yPos += lineHeight * 1.5;
		doc.text(new Date().toUTCString().slice(5, 25), leftMargin, yPos);
		doc.text(`TABLE: ${selectedOrder.table}`, 75, yPos, { align: "right" });
		yPos += lineHeight / 2;
		doc.text("_________________________________", leftMargin, yPos);
		yPos += lineHeight / 2;

		doc.autoTable({
			startY: yPos,
			tableWidth: 75,
			theme: "plain",
			head: [["Item", "Qty", "Price"]],
			body: selectedOrder.items.map((item) => [
				`${item.name}(${item.size})${item.addOn.length ? `,${item.addOn}` : ""}`,
				item.quantity,
				`$${(item.price * item.quantity).toFixed(2)}`,
			]),
			styles: { font: "courier", fontSize: 10, cellPadding: 1 },
			headStyles: { halign: "left", textColor: 20 },
			columnStyles: {
				0: { cellWidth: "auto" },
				1: { cellWidth: 10 },
				2: { cellWidth: 20 },
			},
			margin: { left: 5, right: 5 },
		});

		yPos = doc.lastAutoTable.finalY;

		doc.setFontSize(12);
		doc.text("______", 75, yPos, { align: "right" });

		yPos += lineHeight * 1.5;
		doc.text(`Total: $${selectedOrder.total.toFixed(2)}`, 75, yPos, { align: "right" });
		doc.text("______", 75, yPos, { align: "right" });
		doc.text("______", 75, yPos + 1, { align: "right" });

		doc.autoPrint();
		doc.close();
		document.getElementById("pdf").src = doc.output("datauristring");
	}, [selectedOrder.items, selectedOrder.table, selectedOrder.total]);

	const billSubmit = useCallback(
		async (e) => {
			e.preventDefault();
			setShowHandleOrder(false);

			try {
				const res = await fetch(`/api/order/staff/pending`, {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ id: selectedOrder.id }),
				});

				if (res.ok) {
					createBillPDF();
					setTables((prevTables) =>
						prevTables.map((t) => (t.id === table.id ? { ...table, status: "Available" } : t))
					);
					setOrders((prevOrders) => prevOrders.filter((o) => o._id !== selectedOrder._id));
				} else {
					console.error("Failed to save bill");
				}
			} catch (error) {
				console.error("Error:", error);
			}
		},
		[createBillPDF, selectedOrder._id, selectedOrder.id, table]
	);

	return (
		<>
			<div className="grow flex gap-6">
				<div className="flex flex-col w-3/4">
					<div className="mb-4 flex items-center">
						<h1 className="text-2xl font-bold">Tables</h1>
						<p className="mt-0.5">&nbsp;({tables.length} tables)</p>
					</div>
					<div className="grid grid-cols-4 grid-flow-row gap-6 font-semibold text-white">
						{tables.map((table) => (
							<div
								key={table.name}
								onClick={() => {
									setTable(table);
									if (table.status === "Available") setShowHandleTable(true);
									else setShowHandleOrder(true);
								}}
								className={`flex justify-center py-10 rounded-xl text-5xl cursor-pointer ${
									table.status === "Available" ? "bg-green-500" : "bg-yellow-500"
								}`}
							>
								{table.name}
							</div>
						))}
					</div>
				</div>
				<div className="flex flex-col w-1/4 border-l-2 pl-6">
					<div className="mb-4 flex items-center">
						<h1 className="text-2xl font-bold">Notification</h1>
					</div>
					<div className="flex flex-col gap-4 font-semibold">
						{notifications.map(
							(notification, index) =>
								notification.message !== "Order" && (
									<div
										key={index}
										className={`p-4 rounded ${
											notification.message === "Service" ? "bg-orange-200" : "bg-green-200"
										}`}
									>
										<div className="flex justify-between text-xl font-bold">
											<h2>{notification.message}</h2>
											<h2>{notification.table}</h2>
										</div>

										<button
											onClick={() => {
												deleteNotification(notification.id);
											}}
											className="rounded bg-green-500 py-2 mt-4 w-full text-white"
										>
											Accept
										</button>
									</div>
								)
						)}
					</div>
				</div>
			</div>
			{showHandleTable && (
				<Modal
					onClose={() => {
						setShowHandleTable(false);
					}}
				>
					<form onSubmit={tableSubmit} className="flex flex-col gap-2 rounded p-6">
						<div className="flex justify-between mb-2">
							<h2 className="text-xl font-bold">Table: {table.name}</h2>
							<div className="flex items-center">
								<h3 className="text-xl font-semibold">ID: {id}</h3>
							</div>
						</div>
						<div className="flex flex-col items-center">
							<div className="flex items-center my-5 font-semibold text-3xl gap-4">
								<h2>Table: {table.name}</h2>
								<h3>Size: {table.size}</h3>
							</div>
							<Image
								src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${window.location.origin}/order/${table.name}/${id}`}
								width={150}
								height={150}
								alt="qr-code"
								className="w-1/4"
							/>
						</div>
						<div className="mt-4 flex justify-end">
							<button
								onClick={() => {
									setShowHandleTable(false);
								}}
								className="rounded bg-red-500 p-2 text-white"
							>
								Cancel
							</button>
							<button type="submit" className="ml-2 rounded bg-green-500 p-2 text-white">
								Print Qr-Code
							</button>
						</div>
					</form>
				</Modal>
			)}
			{showHandleOrder && (
				<Modal onClose={() => setShowHandleOrder(false)}>
					<div className="p-6">
						<div className="flex justify-between mb-2">
							<h2 className="text-xl font-bold">Table: {table.name}</h2>
							<div className="flex items-center">
								<h3 className="text-xl font-semibold">ID: {selectedOrder.id}</h3>
							</div>
						</div>
						<table className="w-full">
							<thead>
								<tr>
									<th className="text-left">No.</th>
									<th className="text-left">Item</th>
									<th className="text-left">Status</th>
									<th className="text-left">Qty</th>
									<th className="text-left">Price</th>
								</tr>
							</thead>
							<tbody>
								{selectedOrder.items.length ? (
									selectedOrder.items.map((item, index) => (
										<tr key={index}>
											<td className="border-2 p-2 text-center">{index + 1}</td>
											<td className="border-2 p-2">
												<b>{item.name} </b>({item.size}
												{item.addOn.length > 0 && <span>, {item.addOn.join(", ")}</span>})
											</td>
											<td
												className={`border-2 p-2 text-center font-bold ${
													item.status === "Pending"
														? "text-red-500"
														: item.status === "Ongoing"
														? "text-orange-500"
														: "text-green-500"
												}`}
											>
												{item.status}
											</td>
											<td className="border-2 p-2 text-center">{item.quantity}</td>
											<td className="border-2 p-2">${(item.price * item.quantity).toFixed(2)}</td>
											<td className="w-0 border-2 p-2 text-center">
												<button
													className="mx-auto w-8 cursor-pointer rounded bg-red-500 py-2"
													onClick={(e) => handleConfirmRemove(e, item)}
												>
													<IoTrashBin color="white" size={18} className="mx-auto" />
												</button>
											</td>
										</tr>
									))
								) : (
									<tr>
										<td className="border-2 p-2 text-center">-</td>
										<td className="border-2 p-2 text-center">-</td>
										<td className="border-2 p-2 text-center">-</td>
										<td className="border-2 p-2 text-center">-</td>
										<td className="border-2 p-2 text-center">-</td>
									</tr>
								)}
							</tbody>
						</table>
						<div className="mt-6 flex justify-between">
							<p className="text-2xl font-bold">Total: ${selectedOrder.total.toFixed(2)}</p>
							<div className="flex">
								<button
									onClick={() => setShowHandleOrder(false)}
									className="rounded bg-red-600 px-6 py-2 text-white"
								>
									Close
								</button>
								<button className="ml-4 rounded bg-green-500 px-4 py-2 text-white" onClick={billSubmit}>
									Bill
								</button>
							</div>
						</div>
					</div>
				</Modal>
			)}
			<embed id="pdf" className="invisible w-0 h-0" src="" type="application/pdf" />
			{showConfirmRemove && (
				<>
					<div className="fixed inset-0 z-40 m-auto h-fit w-1/3 overflow-auto rounded-xl bg-white shadow-lg">
						<form onSubmit={handleRemoveItem} className="rounded p-6">
							<div className="flex justify-between">
								<h2 className="mb-4 text-xl font-bold">Remove Item</h2>
								<div className="flex">
									<h2 className="text-lg font-bold">Price:&nbsp;</h2>
									<p className="text-lg">${item.price.toFixed(2)}</p>
								</div>
							</div>
							<div className="flex flex-col w-full gap-2">
								<p className="text-xl font-bold">Name: {item.name}</p>
								<h2 className="text-lg">
									<b>Quantity:</b> {item.quantity}
								</h2>
								<h2 className="text-lg">
									<b>Add-Ons:</b>{" "}
									{item.addOn.length > 0 ? <span>{item.addOn.join(", ")} </span> : "-"}
								</h2>
								<h2 className="text-lg">
									<b>Size:</b> {item.size}
								</h2>
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
					</div>
					<div
						onClick={() => setShowConfirmRemove(false)}
						className="fixed inset-0 z-30 flex items-center justify-center bg-black bg-opacity-50"
					></div>
				</>
			)}
		</>
	);
};

export default TabledPage;
