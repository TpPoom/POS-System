"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";

import Modal from "@/components/Modal";

import { fetchData, handleSort, sortedData, handleSearch } from "@/lib/utils";

import { FaEdit, FaSearch, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { IoTrashBin } from "react-icons/io5";

const ItemsPage = ({ params }) => {
	const [items, setItems] = useState([]);
	const [searchedItems, setSearchedItems] = useState([]);
	const [item, setItem] = useState({});
	const [image, setImage] = useState(null);
	const [lastImage, setLastImage] = useState(null);
	const [sizes, setSizes] = useState([]);
	const [addOns, setAddOns] = useState([]);
	const [selectedItem, setSelectedItem] = useState("");
	const [showHandleItem, setShowHandleItem] = useState(false);
	const [showConfirmRemove, setShowConfirmRemove] = useState(false);
	const [sortConfig, setSortConfig] = useState({
		key: "id",
		direction: "ascending",
	});
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);

	const resetItem = useCallback(() => {
		setItem({
			id: items.length == 0 ? "001" : String(parseInt(items[items.length - 1].id) + 1).padStart(3, "0"),
			name: "",
			category: "",
			description: "",
			price: 0,
			image: "",
			size: {},
			addOn: {},
		});
		setSizes([]);
		setAddOns([]);
		setSelectedItem("");
	}, [items]);

	const indexOfLastItem = useMemo(() => currentPage * itemsPerPage, [currentPage, itemsPerPage]);
	const indexOfFirstItem = useMemo(() => indexOfLastItem - itemsPerPage, [indexOfLastItem, itemsPerPage]);
	const lastPage = useMemo(() => Math.ceil(searchedItems.length / itemsPerPage), [searchedItems, itemsPerPage]);
	const currentItems = sortedData(searchedItems, sortConfig).slice(indexOfFirstItem, indexOfLastItem);

	useEffect(() => {
		const fetchDataAndSetState = async () => {
			const data = await fetchData("item");
			setItems(data);
		};

		fetchDataAndSetState();
	}, []);

	useEffect(() => {
		if (!items.length) return;

		setSearchedItems(items);
	}, [items]);

	const addField = useCallback((setter, newField) => () => setter((prevFields) => [...prevFields, newField]), []);
	const removeField = useCallback(
		(setter, reducer) => (index) => {
			setter((prevFields) => {
				const newFields = prevFields.filter((_, i) => i !== index);
				setItem((prevItem) => ({ ...prevItem, ...reducer(newFields) }));
				return newFields;
			});
		},
		[]
	);

	const addSizeField = addField(setSizes, { size: "", price: "" });
	const removeSizeField = removeField(setSizes, (sizes) => ({
		size: sizes.reduce((acc, size) => ({ ...acc, [size.size]: parseFloat(size.price) }), {}),
	}));

	const addAddOnField = addField(setAddOns, { addOn: "", price: "" });
	const removeAddOnField = removeField(setAddOns, (addOns) => ({
		addOn: addOns.reduce(
			(acc, addOn) => ({
				...acc,
				[addOn.addOn]: parseFloat(addOn.price),
			}),
			{}
		),
	}));

	const renderFields = useCallback(
		(fields, handleChange, addField, removeField) => (
			<div className="flex flex-col">
				{fields.map((field, index) => (
					<div key={index} className="mt-2 flex items-center">
						<input
							type="text"
							placeholder="Name"
							value={field.size || field.addOn}
							onChange={(e) => handleChange(index, "size" in field ? "size" : "addOn", e.target.value)}
							className="mr-2 w-full rounded border p-2"
							disabled={params.role === "manager" ? false : true}
						/>
						<input
							type="number"
							placeholder="Price"
							value={field.price}
							onChange={(e) => handleChange(index, "price", e.target.value)}
							className="w-full rounded border bg-gray-100 p-2"
							disabled={params.role === "manager" ? false : true}
						/>
						<button
							type="button"
							onClick={() => removeField(index)}
							className="ml-2 rounded bg-red-500 p-2 text-white"
							disabled={params.role === "manager" ? false : true}
						>
							Remove
						</button>
					</div>
				))}
				<button
					type="button"
					onClick={addField}
					className="mt-2 rounded bg-blue-500 p-2 text-white"
					disabled={params.role === "manager" ? false : true}
				>
					Add
				</button>
			</div>
		),
		[params.role]
	);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setItem((prevItem) => ({ ...prevItem, [name]: value }));
	};

	const handleImageChange = (e) => {
		const file = e.target.files[0];
		setImage(file);
		setItem((prevItem) => ({ ...prevItem, image: `/uploads/${Date.now()}-${file.name}` }));
	};

	const handleFieldChange = useCallback(
		(setter, reducer) => (index, key, value) => {
			setter((prevFields) => {
				const newFields = [...prevFields];
				newFields[index] = { ...newFields[index], [key]: value };
				setItem((prevItem) => ({ ...prevItem, ...reducer(newFields) }));
				return newFields;
			});
		},
		[]
	);

	const handleSizeChange = handleFieldChange(setSizes, (sizes) => ({
		size: sizes.reduce((acc, size) => ({ ...acc, [size.size]: parseFloat(size.price) }), {}),
	}));

	const handleAddOnChange = handleFieldChange(setAddOns, (addOns) => ({
		addOn: addOns.reduce((acc, addOn) => ({ ...acc, [addOn.addOn]: parseFloat(addOn.price) }), {}),
	}));

	const handleEdit = useCallback((i) => {
		setItem(i);
		setLastImage(i.image);
		setImage(null);
		setSizes(
			Object.keys(i.size).map((size) => ({
				size,
				price: i.size[size],
			}))
		);
		setAddOns(
			Object.keys(i.addOn).map((addOn) => ({
				addOn,
				price: i.addOn[addOn],
			}))
		);
		setSelectedItem(i.id);
		setShowHandleItem(true);
	}, []);

	const handleRemove = async (e) => {
		e.preventDefault();

		try {
			const res = await fetch("/api/item", {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(item),
			});

			if (res.ok) {
				setShowConfirmRemove(false);
				setItems((prevItem) => prevItem.filter((item) => item.id !== selectedItem));
			} else {
				console.error("Failed to delete item");
			}
		} catch (error) {
			console.error("Error:", error);
		}
	};

	const formSubmit = async (e) => {
		e.preventDefault();

		const data = new FormData();
		if (image !== null) data.append("image", image);
		if (selectedItem) data.append("lastImage", lastImage);
		data.append("item", JSON.stringify(item));

		try {
			const res = await fetch("/api/item", {
				method: selectedItem ? "PUT" : "POST",
				body: data,
			});

			if (res.ok) {
				if (selectedItem) {
					setItems((prevItems) => prevItems.map((i) => (i.id === selectedItem ? item : i)));
				} else {
					setItems((prevItems) => [...prevItems, item]);
				}
				resetItem();
				setShowHandleItem(false);
				setImage(null);
			} else {
				console.error("Failed to save item");
			}
		} catch (error) {
			console.error("Error:", error);
		}
	};

	return (
		<>
			<div className="mb-2 flex justify-between">
				<div className="flex items-center">
					<h1 className="text-2xl font-bold">Items</h1>
					<p className="mt-0.5">&nbsp;({items.length} items)</p>
					<button
						onClick={() => {
							setShowHandleItem(true);
							resetItem();
						}}
						className="rounded bg-green-500 px-2 py-1 ml-4 text-white"
					>
						Add Item <span className="text-xl font-bold">+</span>
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
						onChange={(e) => handleSearch(e.target.value, items, setSearchedItems)}
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
							<th key="Image" className="border bg-gray-100 px-4 py-2">
								Image
							</th>
							<th
								key="status"
								className="cursor-pointer border bg-gray-100 py-2 pl-4 pr-1"
								onClick={() => handleSort("status", sortConfig, setSortConfig)}
							>
								<div className="flex items-center justify-between">
									Status
									{sortConfig.key === "status" ? (
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
								key="Category"
								className="cursor-pointer border bg-gray-100 py-2 pl-4 pr-1"
								onClick={() => handleSort("category", sortConfig, setSortConfig)}
							>
								<div className="flex items-center justify-between">
									Category
									{sortConfig.key === "category" ? (
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
							<th key="Description" className="border bg-gray-100 px-4 py-2">
								Description
							</th>
							<th
								key="Price"
								className="cursor-pointer border bg-gray-100 py-2 pl-4 pr-1"
								onClick={() => handleSort("price", sortConfig, setSortConfig)}
							>
								<div className="flex items-center justify-between">
									Price
									{sortConfig.key === "price" ? (
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
							<th key="Size" className="border bg-gray-100 px-4 py-2">
								Size
							</th>
							<th key="Add-On" className="border bg-gray-100 px-4 py-2">
								Add-On
							</th>
							<th key="Actions" className="border bg-gray-100 px-4 py-2">
								Actions
							</th>
						</tr>
					</thead>
					<tbody>
						{currentItems.map((item) => (
							<tr key={item.id}>
								<td className="w-0 border px-4 py-2 text-center">{item.id}</td>
								<td className="w-1/6 border px-4 py-2">
									<Image
										src={item.image}
										alt={item.name}
										width={1000}
										height={1000}
										className="mx-auto max-h-40"
									/>
								</td>
								<td
									className={`w-0 border px-4 py-2 text-center font-bold ${
										item.status === "Out of stock" ? "text-red-500" : "text-green-500"
									}`}
								>
									{item.status}
								</td>
								<td className="w-1/6 border px-4 py-2">{item.name}</td>
								<td className="w-0 border px-4 py-2 text-center">{item.category}</td>
								<td className="w-2/6 border px-4 py-2">{item.description}</td>
								<td className="w-0 border px-4 py-2 text-center">{item.price}</td>
								<td className="w-1/6 border px-4 py-2">
									{Object.entries(item.size).map(([key, value]) => (
										<div key={key}>{`${key}: ${value}`}</div>
									))}
								</td>
								<td className="w-1/6 border px-4 py-2">
									{Object.entries(item.addOn).map(([key, value]) => (
										<div key={key}>{`${key}: ${value}`}</div>
									))}
								</td>
								<td className="w-0 border px-4 py-2">
									<div className="flex gap-2">
										<button
											onClick={() => handleEdit(item)}
											className="rounded bg-blue-500 p-2 text-white"
										>
											<FaEdit />
										</button>
										<button
											onClick={() => {
												setShowConfirmRemove(true);
												setSelectedItem(item.id);
												setItem(item);
											}}
											className="rounded bg-red-500 p-2 text-white"
											disabled={params.role === "manager" ? false : true}
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
						value={itemsPerPage}
						onChange={(e) => setItemsPerPage(e.target.value)}
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
					{indexOfLastItem < searchedItems.length && (
						<button
							onClick={() => setCurrentPage(currentPage + 1)}
							className="rounded bg-gray-200 px-4 py-2"
						>
							Next
						</button>
					)}
				</div>
			</div>
			{showHandleItem && (
				<Modal
					onClose={() => {
						setShowHandleItem(false);
					}}
				>
					<form onSubmit={formSubmit} className="flex flex-col gap-2 rounded p-6">
						<div className="flex justify-between">
							<h2 className="text-xl font-bold">{selectedItem ? "Edit Item" : "Add New Item"}</h2>
							<div className="flex items-center">
								<h3 htmlFor="id" className="text-xl font-semibold">
									ID:
								</h3>
								<input
									type="text"
									name="id"
									value={item["id"]}
									onChange={handleChange}
									placeholder="id"
									className="rounded border bg-gray-100 p-2 w-14 text-center"
									required
									disabled={params.role === "manager" ? false : true}
								/>
							</div>
						</div>
						<div className="flex flex-col">
							<label className="text-lg">Status</label>
							<select
								onChange={handleChange}
								className="rounded border bg-gray-100 p-2"
								name="status"
								value={item["status"]}
								required
							>
								<option value="In stock">In stock</option>
								<option value="Out of stock">Out of stock</option>
							</select>
						</div>
						{["name", "category", "description", "price"].map((field) => (
							<div key={field} className="flex flex-col">
								<label className="mb-1 font-semibold">
									{field.charAt(0).toUpperCase() + field.slice(1)}
								</label>
								<input
									type={field === "price" ? "number" : "text"}
									name={field}
									value={item[field]}
									onChange={handleChange}
									placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
									className="rounded border bg-gray-100 p-2"
									required
									disabled={params.role === "manager" ? false : true}
								/>
							</div>
						))}
						<div className="flex flex-col">
							<label htmlFor="image" className="mb-1 font-semibold">
								Image (jpeg, jpg)
							</label>
							<div className="flex">
								<input
									type="file"
									name="image"
									id="image"
									onChange={handleImageChange}
									className="w-2/3 rounded-l-lg border bg-gray-100 p-2"
									accept="image/png, image/jpeg"
									disabled={params.role === "manager" ? false : true}
								/>
								{item.image !== "" && image == null && (
									<Image
										width={1000}
										height={1000}
										src={item.image}
										alt={item.name}
										className="w-1/3 rounded-r-lg"
									/>
								)}
								{image !== null && (
									<Image
										src={URL.createObjectURL(image)}
										width={1000}
										height={1000}
										alt={image.name}
										className="w-1/3 rounded-r-lg"
									/>
								)}
							</div>
						</div>
						<div className="flex flex-col">
							<h3 className="font-semibold">Sizes</h3>
							{renderFields(sizes, handleSizeChange, addSizeField, removeSizeField)}
						</div>
						<div className="flex flex-col">
							<h3 className="font-semibold">Add-Ons</h3>
							{renderFields(addOns, handleAddOnChange, addAddOnField, removeAddOnField)}
						</div>
						<div className="mt-4 flex justify-end">
							<button
								onClick={() => {
									setShowHandleItem(false);
								}}
								className="rounded bg-red-500 p-2 text-white"
							>
								Cancel
							</button>
							<button type="submit" className="ml-2 rounded bg-green-500 p-2 text-white">
								{selectedItem ? "Update Item" : "Add Item"}
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
							<h2 className="mb-4 text-xl font-bold">Remove Item</h2>
							<div className="flex">
								<h3 htmlFor="id" className="text-xl font-semibold">
									ID:
								</h3>
								<p id="id" className="ml-1 text-xl">
									{item.id}
								</p>
							</div>
						</div>
						<div className="flex flex-col w-full">
							<Image
								src={item.image}
								width={1000}
								height={1000}
								alt={item.name}
								className="mx-auto w-1/2 rounded"
							/>
							<div className="flex mx-auto mt-2">
								<h2 className="text-lg font-bold">Name:&nbsp;</h2>
								<p className="text-lg">{item.name}</p>
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
		</>
	);
};

export default ItemsPage;
