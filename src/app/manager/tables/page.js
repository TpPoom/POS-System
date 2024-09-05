"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";

import Modal from "@/components/Modal";

import { fetchData, handleSort, sortedData, handleSearch } from "@/lib/utils";

import { FaEdit, FaSearch, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { IoTrashBin } from "react-icons/io5";

const TablesPage = () => {
	const [tables, setTables] = useState([]);
	const [searchedTables, setSearchedTables] = useState([]);
	const [table, setTable] = useState({});
	const [selectedTable, setSelectedTable] = useState("");
	const [showHandleTable, setShowHandleTable] = useState(false);
	const [showConfirmRemove, setShowConfirmRemove] = useState(false);
	const [sortConfig, setSortConfig] = useState({
		key: "id",
		direction: "ascending",
	});
	const [currentPage, setCurrentPage] = useState(1);
	const [tablesPerPage, setTablesPerPage] = useState(10);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const resetTable = useCallback(() => {
		const id = tables.length == 0 ? "001" : String(parseInt(tables[tables.length - 1].id) + 1).padStart(3, "0");
		setTable({
			id: id,
			name: "",
			size: 1,
		});
		setSelectedTable("");
	}, [tables]);

	const indexOfLastTable = useMemo(() => currentPage * tablesPerPage, [currentPage, tablesPerPage]);
	const indexOfFirstTable = useMemo(() => indexOfLastTable - tablesPerPage, [indexOfLastTable, tablesPerPage]);
	const lastPage = useMemo(() => Math.ceil(searchedTables.length / tablesPerPage), [searchedTables, tablesPerPage]);
	const currentTables = sortedData(searchedTables, sortConfig).slice(indexOfFirstTable, indexOfLastTable);

	useEffect(() => {
		const fetchDataAndSetState = async () => {
			const data = await fetchData("table");
			setTables(data);
		};

		fetchDataAndSetState();
	}, []);

	useEffect(() => {
		if (!tables.length) return;
		setSearchedTables(tables);
	}, [tables]);

	useEffect(() => {
		setTimeout(() => {
			setSuccess("");
			setError("");
		}, 2000);
	}, [success, error]);

	const handleChange = useCallback((e) => {
		const { name, value } = e.target;
		setTable((prevTable) => ({ ...prevTable, [name]: value }));
	}, []);

	const handleRemove = async (e) => {
		e.preventDefault();

		try {
			const res = await fetch("/api/table", {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(table),
			});

			if (res.ok) {
				setShowConfirmRemove(false);
				setTables((prevTable) => prevTable.filter((table) => table.id !== selectedTable));
				setSuccess("Table deleted!");
			} else {
				setError("Failed to delete table");
			}
		} catch (error) {
			setError("Error:", error);
		}
	};

	const formSubmit = async (e) => {
		e.preventDefault();

		try {
			const res = await fetch("/api/table", {
				method: selectedTable ? "PUT" : "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(table),
			});

			if (res.ok) {
				if (selectedTable) {
					setSuccess("Table has been edited successfully!");
					setTables((prevTables) => prevTables.map((t) => (t.id === selectedTable ? table : t)));
				} else {
					setSuccess("Table added successfully!");
					setTables((prevTables) => [...prevTables, table]);
				}
				resetTable();
				setShowHandleTable(false);
			} else {
				setError("Failed to save table");
			}
		} catch (error) {
			setError("Error:", error);
		}
	};

	return (
		<>
			<div className="mb-2 flex justify-between">
				<div className="flex items-center">
					<h1 className="text-2xl font-bold">Tables</h1>
					<p className="mt-0.5">&nbsp;({tables.length} tables)</p>
					<button
						onClick={() => {
							setShowHandleTable(true);
							resetTable();
						}}
						className="rounded bg-green-500 px-2 py-1 ml-4 text-white"
					>
						Add Table <span className="text-xl font-bold">+</span>
					</button>
				</div>
				<div className="flex items-center">
					<input
						type="number"
						name="page"
						value={currentPage}
						onChange={(e) =>
							setCurrentPage(parseInt(e.target.value) > lastPage ? lastPage : parseInt(e.target.value))
						}
						placeholder="0"
						className="rounded border bg-gray-100 p-1 w-8 text-center remove-arrow"
						required
					/>
					/{lastPage} pages
				</div>
				<div className="flex items-center rounded border bg-gray-100 p-1 w-50">
					<FaSearch size={20} className="mx-2 text-gray-500" />
					<input
						type="text"
						placeholder="Search"
						className="bg-gray-100 focus:outline-none text-lg"
						onChange={(e) => handleSearch(e.target.value, tables, setSearchedTables)}
					/>
				</div>
			</div>
			<div className="overflow-x-auto">
				<table className="min-w-full table-auto border border-gray-200 bg-white">
					<thead>
						<tr>
							<th
								key="ID"
								className="cursor-pointer border bg-gray-100 py-2 pl-4 pr-1"
								onClick={() => handleSort("id", sortConfig, setSortConfig)}
							>
								<div className="flex items-center justify-between">
									ID
									{sortConfig.key === "id" ? (
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
							<th
								key="Name"
								className="cursor-pointer border bg-gray-100 py-2 pl-4 pr-1"
								onClick={() => handleSort("name", sortConfig, setSortConfig)}
							>
								<div className="flex items-center justify-between">
									Name
									{sortConfig.key === "name" ? (
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
							<th
								key="Size"
								className="cursor-pointer border bg-gray-100 py-2 pl-4 pr-1"
								onClick={() => handleSort("size", sortConfig, setSortConfig)}
							>
								<div className="flex items-center justify-between">
									Size
									{sortConfig.key === "size" ? (
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
							<th key="Actions" className="border bg-gray-100 px-4 py-2">
								Actions
							</th>
						</tr>
					</thead>
					<tbody>
						{currentTables.map((table) => (
							<tr key={table.id}>
								<td className="w-0 border px-4 py-2 text-center">{table.id}</td>
								<td className="w-5/6 border px-4 py-2">{table.name}</td>
								<td className="w-1/6 border px-4 py-2 text-center">{table.size}</td>
								<td className="w-0 border px-4 py-2">
									<div className="flex gap-2">
										<button
											onClick={() => {
												setSelectedTable(table.id);
												setTable(table);
												setShowHandleTable(true);
											}}
											className="rounded bg-blue-500 p-2 text-white"
										>
											<FaEdit />
										</button>
										<button
											onClick={() => {
												setSelectedTable(table.id);
												setTable(table);
												setShowConfirmRemove(true);
											}}
											className="rounded bg-red-500 p-2 text-white"
										>
											<IoTrashBin />
										</button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<div className="flex justify-between items-center mt-4">
				<div className="flex items-center gap-2">
					Show
					<input
						type="number"
						name="entries"
						value={tablesPerPage}
						onChange={(e) => setTablesPerPage(e.target.value)}
						placeholder="0"
						className="rounded border bg-gray-100 p-2 w-14 text-center remove-arrow"
						required
					/>
					entries
				</div>
				<div className="flex space-x-4">
					{currentPage > 1 && (
						<button
							onClick={() => setCurrentPage(currentPage - 1)}
							className="rounded bg-gray-200 px-4 py-2"
						>
							Previous
						</button>
					)}
					{indexOfLastTable < searchedTables.length && (
						<button
							onClick={() => setCurrentPage(currentPage + 1)}
							className="rounded bg-gray-200 px-4 py-2"
						>
							Next
						</button>
					)}
				</div>
			</div>
			{showHandleTable && (
				<Modal
					onClose={() => {
						setShowHandleTable(false);
					}}
				>
					<form onSubmit={formSubmit} className="flex flex-col gap-2 rounded p-6">
						<div className="flex justify-between">
							<h2 className="text-xl font-bold">{selectedTable ? "Edit Table" : "Add New Table"}</h2>
							<div className="flex items-center">
								<h3 htmlFor="id" className="text-xl font-semibold">
									ID:
								</h3>
								<input
									type="text"
									name="id"
									value={table["id"]}
									onChange={handleChange}
									placeholder="id"
									className="rounded border bg-gray-100 p-2 w-14 text-center"
									required
								/>
							</div>
						</div>
						{["name", "size"].map((field) => (
							<div key={field} className="flex flex-col">
								<label className="mb-1 font-semibold">
									{field.charAt(0).toUpperCase() + field.slice(1)}
								</label>
								<input
									type={field === "size" ? "number" : "text"}
									name={field}
									value={table[field]}
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
									setShowHandleTable(false);
								}}
								className="rounded bg-red-500 p-2 text-white"
							>
								Cancel
							</button>
							<button type="submit" className="ml-2 rounded bg-green-500 p-2 text-white">
								{selectedTable ? "Update Table" : "Add Table"}
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
						<div className="flex justify-between">
							<h2 className="mb-4 text-xl font-bold">Remove Table</h2>
							<div className="flex">
								<h3 htmlFor="id" className="text-xl font-semibold">
									ID:
								</h3>
								<p id="id" className="ml-1 text-xl">
									{table.id}
								</p>
							</div>
						</div>
						<div className="flex flex-col w-full mt-2 items-center">
							<div className="flex text-3xl">
								<h2 className="font-bold">Name:&nbsp;</h2>
								<p>{table.name}</p>
							</div>
							<div className="flex text-2xl">
								<h2 className="font-bold">Size:&nbsp;</h2>
								<p>{table.size}</p>
							</div>
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
			{error && (
				<div className="text-md fixed right-10 top-10 z-30 rounded-md bg-red-500 px-4 py-2 text-white">
					{error}
				</div>
			)}
			{success && (
				<div className="text-md fixed right-10 top-10 z-30 rounded-md bg-green-500 px-4 py-2 text-white">
					{success}
				</div>
			)}
		</>
	);
};

export default TablesPage;
