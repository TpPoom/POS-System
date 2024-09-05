"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import io from "socket.io-client";

import Modal from "@/components/Modal";
import Store from "@/store.json";
import jsPDF from "jspdf";
import "jspdf-autotable";

import { fetchData, handleSort, sortedData } from "@/lib/utils";

import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { IoEyeSharp } from "react-icons/io5";

const BillsPage = ({ params }) => {
	const [notifications, setNotifications] = useState([]);
	const [bills, setBills] = useState([]);
	const [filteredBills, setFilteredBills] = useState([]);
	const [bill, setBill] = useState({});
	const [showHandleBill, setShowHandleBill] = useState(false);
	const [sortConfig, setSortConfig] = useState({
		key: "id",
		direction: "ascending",
	});
	const [currentPage, setCurrentPage] = useState(1);
	const [billsPerPage, setBillsPerPage] = useState(10);
	const [selectedStartDate, setSelectedStartDate] = useState(new Date());
	const [selectedEndDate, setSelectedEndDate] = useState(new Date());
	const [minDate, setMinDate] = useState(new Date());

	const indexOfLastBill = useMemo(() => currentPage * billsPerPage, [currentPage, billsPerPage]);
	const indexOfFirstBill = useMemo(() => indexOfLastBill - billsPerPage, [indexOfLastBill, billsPerPage]);
	const lastPage = useMemo(() => Math.ceil(filteredBills.length / billsPerPage), [filteredBills, billsPerPage]);
	const currentBills = useMemo(() => {
		return sortedData(filteredBills, sortConfig).slice(indexOfFirstBill, indexOfLastBill);
	}, [filteredBills, sortConfig, indexOfFirstBill, indexOfLastBill]);

	const fetchNotifications = useCallback(() => {
		const newSocket = io("http://localhost:3000");

		newSocket.on("initialNotifications", setNotifications);
		newSocket.on("newNotification", (notification) => setNotifications((prev) => [...prev, notification]));

		return () => {
			newSocket.disconnect();
		};
	}, []);

	useEffect(() => {
		fetchNotifications();
	}, [fetchNotifications]);

	const fetchAndSetBills = useCallback(async () => {
		const data = params.role === "manager" ? await fetchData("order") : await fetchData("order/staff");

		let newMinDate = new Date();

		const updatedOrders = data.map((order) => {
			const updatedTotal = order.items.reduce((total, item) => total + item.price * item.quantity, 0);
			const orderDate = new Date(order.updatedAt);

			if (orderDate < newMinDate) {
				newMinDate = orderDate;
			}

			return { ...order, total: updatedTotal };
		});

		setMinDate(newMinDate);
		setSelectedStartDate(newMinDate);
		setBills(updatedOrders);
	}, [params.role]);

	useEffect(() => {
		fetchAndSetBills();
	}, [fetchAndSetBills, notifications]);

	useEffect(() => {
		if (!bills.length) return;

		const newBills = bills.filter((b) => {
			const billDate = new Date(b.updatedAt);
			const newSelectedEndDate = new Date(selectedEndDate);
			newSelectedEndDate.setDate(newSelectedEndDate.getDate() + 1);
			return billDate >= selectedStartDate && billDate <= newSelectedEndDate;
		});
		setFilteredBills(newBills);
	}, [bills, selectedStartDate, selectedEndDate]);

	const handlePageChange = (newPage) => {
		setCurrentPage(Math.max(1, Math.min(newPage, lastPage)));
	};

	const handleEntriesChange = (e) => {
		const value = Math.max(1, parseInt(e.target.value, 10));
		setBillsPerPage(value);
	};

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
		doc.text(Store.name, 40, yPos, { align: "center" });
		yPos += lineHeight;
		doc.text(Store.address, 40, yPos, { align: "center" });
		yPos += lineHeight;
		doc.text(`Tel ${Store.tel}`, 40, yPos, { align: "center" });
		yPos += lineHeight * 1.5;
		doc.text(new Date().toUTCString().slice(5, 25), leftMargin, yPos);
		doc.text(`TABLE: ${bill.table}`, 75, yPos, { align: "right" });
		yPos += lineHeight / 2;
		doc.text("_________________________________", leftMargin, yPos);
		yPos += lineHeight / 2;

		doc.autoTable({
			startY: yPos,
			tableWidth: 75,
			theme: "plain",
			head: [["Item", "Qty", "Price"]],
			body: bill.items.map((item) => [
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
		doc.text(`Total: $${bill.total.toFixed(2)}`, 75, yPos, { align: "right" });
		doc.text("______", 75, yPos, { align: "right" });
		doc.text("______", 75, yPos + 1, { align: "right" });

		doc.autoPrint();
		doc.close();
		document.getElementById("pdf").src = doc.output("datauristring");
	}, [showHandleBill]);

	return (
		<>
			<div className="mb-2 flex justify-between">
				<div className="flex items-center w-1/5">
					<h1 className="text-2xl font-bold">{params.role === "manager" ? "Bills" : "Today Bills"}</h1>
					<p className="mt-0.5">&nbsp;({bills.length} bills)</p>
				</div>
				<div className="flex items-center">
					<input
						type="number"
						name="page"
						value={currentPage}
						onChange={(e) => handlePageChange(parseInt(e.target.value))}
						className="rounded border bg-gray-100 p-1 w-8 text-center remove-arrow"
						required
					/>
					/{lastPage} pages
				</div>
				{params.role === "manager" && (
					<div className="flex items-center w-50">
						<input
							type="date"
							value={selectedStartDate.toISOString().slice(0, 10)}
							onChange={(e) => setSelectedStartDate(new Date(e.target.value))}
							className="rounded border bg-gray-100 p-1"
							min={minDate.toISOString().slice(0, 10)}
							max={selectedEndDate.toISOString().slice(0, 10)}
						/>
						<p className="mx-2">-</p>
						<input
							type="date"
							value={selectedEndDate.toISOString().slice(0, 10)}
							onChange={(e) => setSelectedEndDate(new Date(e.target.value))}
							className="rounded border bg-gray-100 p-1"
							min={selectedStartDate.toISOString().slice(0, 10)}
							max={new Date().toISOString().slice(0, 10)}
						/>
					</div>
				)}
			</div>
			<div className="overflow-x-auto">
				<table className="min-w-full table-auto border border-gray-200 bg-white">
					<thead>
						<tr>
							{["ID", "Status", "Total", "Table", "Date"].map((header) => (
								<th
									key={header}
									className="cursor-pointer border bg-gray-100 py-2 pl-4 pr-1"
									onClick={() => handleSort(header.toLowerCase(), sortConfig, setSortConfig)}
								>
									<div className="flex items-center justify-between">
										{header}
										{sortConfig.key === header.toLowerCase() ? (
											sortConfig.direction === "ascending" ? (
												<FaSortUp />
											) : (
												<FaSortDown />
											)
										) : (
											<FaSort />
										)}
									</div>
								</th>
							))}
							<th key="Time" className="border bg-gray-100 px-4 py-2">
								Time
							</th>
							<th key="Actions" className="border bg-gray-100 px-4 py-2"></th>
						</tr>
					</thead>
					<tbody>
						{currentBills.map((bill) => {
							const updatedAt = new Date(bill.updatedAt);
							const formattedDate = updatedAt.toLocaleDateString();
							const formattedTime = updatedAt.toLocaleTimeString();
							return (
								<tr key={bill.id} className="even:bg-slate-50">
									<td className="w-0 border px-4 py-2 text-center">{bill.id}</td>
									<td className="w-1/4 border px-4 py-2 text-center">{bill.status}</td>
									<td className="w-1/4 border px-4 py-2 text-center">{bill.total.toFixed(2)}</td>
									<td className="w-1/6 border px-4 py-2 text-center">{bill.table}</td>
									<td className="w-1/6 border px-4 py-2 text-center">{formattedDate}</td>
									<td className="w-1/6 border px-4 py-2 text-center">{formattedTime}</td>
									<td className="w-0 border px-4 py-2">
										<div className="flex justify-center">
											<button
												onClick={() => {
													setBill(bill);
													setShowHandleBill(true);
												}}
												className="rounded bg-blue-500 p-2 text-white"
											>
												<IoEyeSharp />
											</button>
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
			<div className="flex justify-between items-center mt-4">
				<div className="flex items-center gap-2">
					Show
					<input
						type="number"
						name="entries"
						value={billsPerPage}
						onChange={handleEntriesChange}
						placeholder="0"
						className="rounded border bg-gray-100 p-2 w-14 text-center remove-arrow"
						required
					/>
					entries
				</div>
				<div className="flex space-x-4">
					{currentPage > 1 && (
						<button
							onClick={() => handlePageChange(currentPage - 1)}
							className="rounded bg-gray-200 px-4 py-2"
						>
							Previous
						</button>
					)}
					{indexOfLastBill < filteredBills.length && (
						<button
							onClick={() => handlePageChange(currentPage + 1)}
							className="rounded bg-gray-200 px-4 py-2"
						>
							Next
						</button>
					)}
				</div>
			</div>
			{showHandleBill && (
				<Modal
					onClose={() => {
						setShowHandleBill(false);
					}}
				>
					<div className="p-6">
						<div className="flex mb-4 justify-between font-bold items-center">
							<h2 className="text-3xl">Bill</h2>
							<div className="flex gap-4 text-2xl">
								<h2>Table: {bill.table}</h2>
								<h2>ID: {bill.id}</h2>
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
								{bill.items.length === 0 ? (
									<tr>
										<td className="border-2 p-2 text-center">-</td>
										<td className="border-2 p-2 text-center">-</td>
										<td className="border-2 p-2 text-center">-</td>
										<td className="border-2 p-2 text-center">-</td>
										<td className="border-2 p-2 text-center">-</td>
									</tr>
								) : (
									bill.items.map((b, index) => (
										<tr key={index}>
											<td className="border-2 p-2 text-center">{index + 1}</td>
											<td className="border-2 p-2">
												<b>{b.name} </b>({b.size}
												{b.addOn.length > 0 && <span>, {b.addOn.join(", ")}</span>})
											</td>
											<td
												className={`border-2 p-2 text-center font-bold ${b.status === "Pending" ? "text-red-500" : b.status === "Ongoing" ? "text-orange-500" : "text-green-500"}`}
											>
												{b.status}
											</td>
											<td className="border-2 p-2 text-center">{b.quantity}</td>
											<td className="border-2 p-2">${(b.price * b.quantity).toFixed(2)}</td>
										</tr>
									))
								)}
							</tbody>
						</table>
						<div className="mt-6 flex justify-between">
							<p className="text-2xl font-bold">Total: ${bill.total.toFixed(2)}</p>
							<div className="flex gap-2">
								<button
									onClick={() => setShowHandleBill(false)}
									className="rounded bg-red-500 px-6 py-2 text-white"
								>
									Close
								</button>
								<button
									onClick={() => {
										createBillPDF();
										setShowHandleBill(false);
									}}
									className="rounded bg-green-500 px-6 py-2 text-white"
								>
									Print
								</button>
							</div>
						</div>
					</div>
				</Modal>
			)}
			<embed id="pdf" className="invisible w-0 h-0" src="" type="application/pdf" />
		</>
	);
};

export default BillsPage;
