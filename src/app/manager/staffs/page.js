"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";

import Modal from "@/components/Modal";

import { fetchData, handleSort, sortedData, handleSearch } from "@/lib/utils";

import { FaEdit, FaSearch, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { IoTrashBin } from "react-icons/io5";

const staffsPage = () => {
	const [staffs, setStaffs] = useState([]);
	const [searchedStaffs, setSearchedStaffs] = useState([]);
	const [staff, setStaff] = useState({});
	const [confirmPassword, setConfirmPassword] = useState("");
	const [selectedStaff, setSelectedStaff] = useState("");
	const [showHandleStaff, setShowHandleStaff] = useState(false);
	const [showConfirmRemove, setShowConfirmRemove] = useState(false);
	const [sortConfig, setSortConfig] = useState({
		key: "id",
		direction: "ascending",
	});
	const [currentPage, setCurrentPage] = useState(1);
	const [staffsPerPage, setStaffsPerPage] = useState(10);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const resetStaff = useCallback(() => {
		setStaff({
			role: "cashier",
			id: staffs.length == 0 ? "001" : String(parseInt(staffs[staffs.length - 1].id) + 1).padStart(3, "0"),
			name: "",
			username: "",
			password: "",
		});
		setConfirmPassword("");
		setSelectedStaff("");
	}, [staffs]);

	const indexOfLastStaff = useMemo(() => currentPage * staffsPerPage, [currentPage, staffsPerPage, searchedStaffs]);
	const indexOfFirstStaff = useMemo(
		() => indexOfLastStaff - staffsPerPage,
		[indexOfLastStaff, staffsPerPage, searchedStaffs]
	);
	const lastPage = useMemo(
		() => Math.ceil(searchedStaffs.length / staffsPerPage),
		[searchedStaffs, staffsPerPage, searchedStaffs]
	);
	const currentstaffs = sortedData(searchedStaffs, sortConfig).slice(indexOfFirstStaff, indexOfLastStaff);

	useEffect(() => {
		const fetchDataAndSetState = async () => {
			const data = await fetchData("user");
			setStaffs(data);
		};

		fetchDataAndSetState();
	}, []);

	useEffect(() => {
		if (!staffs.length) return;
		setSearchedStaffs(staffs);
	}, [staffs]);

	useEffect(() => {
		setTimeout(() => {
			setSuccess("");
			setError("");
		}, 2000);
	}, [success, error]);

	const handleChange = useCallback((e) => {
		const { name, value } = e.target;
		setStaff((prevItem) => ({ ...prevItem, [name]: value }));
	}, []);

	const handleEdit = useCallback((staff) => {
		setStaff(staff);
		setSelectedStaff(staff.id);
		setStaff((prevItem) => ({ ...prevItem, password: "" }));
		setShowHandleStaff(true);
	}, []);

	const handleRemove = async (e) => {
		e.preventDefault();

		try {
			const res = await fetch("/api/user", {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(staff),
			});

			if (res.ok) {
				setShowConfirmRemove(false);
				setStaffs((prevStaff) => prevStaff.filter((staff) => staff.id !== selectedStaff));
				setSuccess("Staff deleted!");
			} else setError("Failed to delete staff");
		} catch (error) {
			setError("Error:", error);
		}
	};

	const formSubmit = async (e) => {
		e.preventDefault();

		if (staff.password != confirmPassword) {
			setError("Password do not match!");
			return;
		}

		try {
			const res = await fetch("/api/user", {
				method: selectedStaff ? "PUT" : "POST",
				body: JSON.stringify(staff),
			});

			if (res.ok) {
				if (selectedStaff) {
					setSuccess("Staff has been edited successfully!");
					setStaffs((prevStaff) => prevStaff.map((s) => (s.id === selectedStaff ? staff : s)));
				} else {
					setSuccess("Staff added successfully!");
					setStaffs((prevStaff) => [...prevStaff, staff]);
				}
				resetStaff();
				setShowHandleStaff(false);
			} else {
				setError("Staff already exists.");
			}
		} catch (error) {
			setError("Error during registration: ", error);
		}
	};

	return (
		<>
			<div className="mb-2 flex justify-between">
				<div className="flex items-center">
					<h1 className="text-2xl font-bold">Staffs</h1>
					<p className="mt-0.5">&nbsp;({staffs.length} staffs)</p>
					<button
						onClick={() => {
							setShowHandleStaff(true);
							resetStaff();
						}}
						className="rounded bg-green-500 px-2 py-1 ml-4 text-white"
					>
						Add Staff <span className="text-xl font-bold">+</span>
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
						onChange={(e) => handleSearch(e.target.value, staffs, setSearchedStaffs)}
					/>
				</div>
			</div>
			<div className="overflow-x-auto">
				<table className="min-w-full table-auto border border-gray-200 bg-white">
					<thead>
						<tr>
							<th
								key="Id"
								className="border bg-slate-100 pl-4 pr-1 py-2 cursor-pointer"
								onClick={() => handleSort("id", sortConfig, setSortConfig)}
							>
								<div className="flex justify-between items-center">
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
								className="border bg-slate-100 pl-4 pr-1 py-2 cursor-pointer"
								onClick={() => handleSort("name", sortConfig, setSortConfig)}
							>
								<div className="flex justify-between items-center">
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
								key="Username"
								className="border bg-slate-100 pl-4 pr-1 py-2 cursor-pointer"
								onClick={() => handleSort("username", sortConfig, setSortConfig)}
							>
								<div className="flex justify-between items-center">
									Username
									{sortConfig.key === "username" ? (
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
								key="Role"
								className="border bg-slate-100 pl-4 pr-1 py-2 cursor-pointer"
								onClick={() => handleSort("role", sortConfig, setSortConfig)}
							>
								<div className="flex justify-between items-center">
									Role
									{sortConfig.key === "role" ? (
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
							<th key="Actions" className="border bg-slate-100 px-4 py-2">
								Actions
							</th>
						</tr>
					</thead>
					<tbody>
						{currentstaffs.map((staff) => (
							<tr key={staff.id}>
								<td className="w-fit border px-4 py-2 text-center">{staff.id}</td>
								<td className="w-1/2 border px-4 py-2 text-center">{staff.name}</td>
								<td className="w-1/2 border px-4 py-2 text-center">{staff.username}</td>
								<td className="w-fit border px-4 py-2 text-center">{staff.role}</td>
								<td className="w-0 border px-4 py-2">
									<div className="w-fit flex gap-2">
										<button
											onClick={() => handleEdit(staff)}
											className="rounded bg-blue-500 p-2 text-white"
										>
											<FaEdit />
										</button>
										<button
											onClick={() => {
												setShowConfirmRemove(true);
												setSelectedStaff(staff.id);
												setStaff(staff);
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
						value={staffsPerPage}
						onChange={(e) => setStaffsPerPage(e.target.value)}
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
							className="rounded bg-slate-200 px-4 py-2"
						>
							Previous
						</button>
					)}
					{indexOfLastStaff < searchedStaffs.length && (
						<button
							onClick={() => setCurrentPage(currentPage + 1)}
							className="rounded bg-slate-200 px-4 py-2"
						>
							Next
						</button>
					)}
				</div>
			</div>

			{showHandleStaff && (
				<Modal
					onClose={() => {
						setShowHandleStaff(false);
					}}
				>
					<form onSubmit={formSubmit} className="flex flex-col gap-2 rounded p-6">
						<div className="flex justify-between">
							<h2 className="text-2xl font-bold">{selectedStaff ? "Edit" : "Add Staff"}</h2>
							<div className="flex items-center">
								<h3 htmlFor="id" className="text-xl font-semibold">
									ID:
								</h3>
								<input
									type="text"
									name="id"
									value={staff["id"]}
									onChange={handleChange}
									placeholder="id"
									className="rounded border bg-gray-100 p-2 w-14 text-center"
									required
								/>
							</div>
						</div>
						<div className="flex flex-col">
							<label className="text-lg">Role</label>
							<select
								onChange={handleChange}
								className="rounded border bg-gray-100 p-2"
								name="role"
								value={staff.role}
								required
							>
								<option value="cashier">Cashier</option>
								<option value="manager">Manager</option>
								<option value="chef">Chef</option>
							</select>
						</div>
						{["name", "username"].map((field) => (
							<div key={field} className="flex flex-col">
								<label className="mb-1 font-semibold">
									{field.charAt(0).toUpperCase() + field.slice(1)}
								</label>
								<input
									type="text"
									name={field}
									value={staff[field]}
									onChange={handleChange}
									placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
									className="rounded border bg-gray-100 p-2"
									required
								/>
							</div>
						))}
						{!selectedStaff && (
							<>
								<div className="flex flex-col">
									<label className="mb-1 font-semibold">Password</label>
									<input
										type="password"
										name="password"
										onChange={handleChange}
										className="rounded border bg-gray-100 p-2"
										placeholder="Enter Password"
										required
									/>
								</div>
								<div className="flex flex-col">
									<label className="mb-1 font-semibold">Confirm Password</label>
									<input
										type="password"
										onChange={(e) => setConfirmPassword(e.target.value)}
										className="rounded border bg-gray-100 p-2"
										name="confirmPassword"
										placeholder="Enter Confirm Password"
										required
									/>
								</div>
							</>
						)}
						<div className="mt-4 flex justify-end">
							<button
								onClick={() => {
									setShowHandleStaff(false);
								}}
								className="rounded bg-red-500 p-2 text-white"
							>
								Cancel
							</button>
							<button type="submit" className="ml-2 rounded bg-green-500 p-2 text-white">
								{selectedStaff ? "Update Staff" : "Add Staff"}
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
							<h2 className="mb-4 text-xl font-bold">Remove Staff</h2>
							<div className="flex">
								<h3 htmlFor="id" className="text-xl font-semibold">
									ID:
								</h3>
								<p id="id" className="ml-1 text-xl">
									{staff.id}
								</p>
							</div>
						</div>
						<div className="flex flex-col w-full">
							<div className="flex mt-2">
								<h2 className="text-lg font-bold">Name:&nbsp;</h2>
								<p className="text-lg">{staff.name}</p>
							</div>
						</div>
						<div className="flex flex-col w-full">
							<div className="flex mt-2">
								<h2 className="text-lg font-bold">Username:&nbsp;</h2>
								<p className="text-lg">{staff.username}</p>
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

export default staffsPage;
