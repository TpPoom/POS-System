"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";

import io from "socket.io-client";

import Modal from "@/components/Modal";

import { FaSearch } from "react-icons/fa";
import { RiBillFill } from "react-icons/ri";
import { IoNotifications, IoCart, IoTrashBin } from "react-icons/io5";

import { fetchData, handleSearch } from "@/lib/utils";

const OrderPage = ({ params }) => {
	const router = useRouter();
	const [socket, setSocket] = useState(null);

	const [items, setItems] = useState([]);
	const [searchedItems, setSearchedItems] = useState([]);
	const [selectedItem, setSelectedItem] = useState(null);
	const [selectedSize, setSelectedSize] = useState();
	const [selectedAddOns, setSelectedAddOns] = useState([]);
	const [quantity, setQuantity] = useState(1);
	const [totalCartPrice, setTotalCartPrice] = useState(0);
	const [totalBillPrice, setTotalBillPrice] = useState(0);
	const [cartItems, setCartItems] = useState([]);
	const [billItems, setBillItems] = useState([]);

	const [showAddToCart, setShowAddToCart] = useState(false);
	const [showCart, setShowCart] = useState(false);
	const [showBill, setShowBill] = useState(false);
	const [showService, setShowService] = useState(false);

	const categories = useMemo(() => Array.from(new Set(searchedItems.map((item) => item.category))), [searchedItems]);
	const categoriesRefs = useRef([]);

	useEffect(() => {
		const newSocket = io("http://localhost:3000");
		setSocket(newSocket);

		return () => {
			newSocket.disconnect();
		};
	}, []);

	useEffect(() => {
		const getBill = async () => {
			try {
				const res = await fetch(`/api/order/${params.table}/${params.id}`);

				const billData = await res.json();

				if (!res.ok || billData.status !== "Pending") router.replace("/404");

				setBillItems(billData.items);
			} catch (error) {
				console.error("Error fetching data:", error);
				return null;
			}
		};

		getBill();

		const getData = async () => {
			const data = await fetchData("item");
			setItems(data);
		};

		getData();
	}, []);

	useEffect(() => {
		setSearchedItems(items);
	}, [items]);

	useEffect(() => {
		if (!cartItems) return;

		const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
		setTotalCartPrice(total);
	}, [cartItems]);

	useEffect(() => {
		if (!billItems) return;

		const total = billItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
		setTotalBillPrice(total);
	}, [billItems]);

	const handleScrollTo = useCallback(
		(index) => {
			if (categoriesRefs.current[index]) {
				const offset = 60;
				const elementPosition = categoriesRefs.current[index].getBoundingClientRect().top + window.scrollY;
				const offsetPosition = elementPosition - offset;

				window.scrollTo({
					top: offsetPosition,
					behavior: "smooth",
				});
			}
		},
		[categoriesRefs]
	);

	const handleAddToCart = useCallback((item) => {
		setQuantity(1);
		setSelectedItem(item);
		setSelectedSize(Object.keys(item.size)[0]);
		setSelectedAddOns([]);
		setShowAddToCart(true);
	}, []);

	const addToCart = useCallback(
		(e) => {
			e.preventDefault();

			const sizePrice = selectedItem.size[selectedSize];
			const addOnsPrice = selectedAddOns
				? selectedAddOns.reduce((total, addOn) => total + selectedItem.addOn[addOn], 0)
				: 0;
			const itemTotalPrice = selectedItem.price + sizePrice + addOnsPrice;

			const cartItem = {
				category: selectedItem.category,
				name: selectedItem.name,
				size: selectedSize,
				addOn: selectedAddOns,
				quantity: quantity,
				price: itemTotalPrice,
			};

			setCartItems((prevCartItems) => [...prevCartItems, cartItem]);

			setShowAddToCart(false);
		},
		[selectedItem, selectedSize, selectedAddOns, quantity]
	);

	const handleRemoveItem = useCallback(
		(index) => {
			setCartItems(cartItems.filter((item) => item !== cartItems[index]));
		},
		[cartItems]
	);

	const orderSubmit = useCallback(
		async (e) => {
			e.preventDefault();
			setShowCart(false);

			if (cartItems.length === 0) {
				setShowCart(false);
				return;
			}

			try {
				const res = await fetch(`/api/order/${params.table}/${params.id}`, {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						items: [...cartItems],
					}),
				});

				if (res.ok) {
					socket.emit("sendNotification", "Order", params.table);
					setBillItems([...billItems, ...cartItems]);
					setCartItems([]);
				} else {
					console.error("Failed to save order");
				}
			} catch (error) {
				console.error(`Error: ${error.message}`);
			}
		},
		[showCart]
	);

	const billSubmit = useCallback(
		async (e) => {
			e.preventDefault();
			setShowBill(false);

			if (billItems.length === 0) {
				return;
			}

			socket.emit("sendNotification", "Bill", params.table);
		},
		[showBill]
	);

	return (
		<>
			<nav className="sticky top-0 flex searchedItems-center justify-between bg-white px-12 py-3 shadow-md">
				<div className="flex items-center w-full px-2">
					<FaSearch size={20} className="text-gray-500" />
					<input
						type="text"
						placeholder="Search menu"
						className="ml-3 w-1/6 border-b-2"
						onChange={(e) => handleSearch(e.target.value, items, setSearchedItems)}
					/>
				</div>
				<ul className="flex space-x-4">
					{categories.map((category, index) => (
						<a key={index} className="cursor-pointer" onClick={() => handleScrollTo(index)}>
							{category}
						</a>
					))}
				</ul>
			</nav>
			<div className="flex grow px-12 py-4">
				<div className="flex w-full flex-col gap-8">
					{categories.map((category, index) => (
						<div
							key={category}
							ref={(el) => (categoriesRefs.current[index] = el)}
							className="flex flex-col gap-2"
						>
							<h2 className="w-full border-b-2 text-xl font-bold">{category.toUpperCase()}</h2>
							<div className="flex flex-wrap gap-2">
								{searchedItems
									.filter((item) => item.category === category)
									.map((item) => (
										<div
											key={item.id}
											onClick={() =>
												item.status === "Out of stock" ? null : handleAddToCart(item)
											}
											className={`flex h-fit cursor-pointer flex-col rounded-b-lg p-6 shadow-xl ${
												item.status === "Out of stock" ? "opacity-50 cursor-not-allowed" : ""
											}`}
										>
											<img src={item.image} alt={item.name} className="h-60 w-60 object-cover" />
											<div className="flex w-60 flex-col">
												<h3 className="font-bold">{item.name}</h3>
												<p>{item.description}</p>
												<h4 className="text-lg font-bold">${item.price}</h4>
											</div>
											{item.status === "Out of stock" && (
												<div className="text-lg text-red-600 font-bold mx-auto">
													Out of stock
												</div>
											)}
										</div>
									))}
							</div>
						</div>
					))}
				</div>
			</div>
			{showAddToCart && (
				<Modal onClose={() => setShowAddToCart(false)}>
					<img
						src={selectedItem.image}
						alt={selectedItem.name}
						className="h-60 w-full rounded-t-lg object-cover"
					/>
					<form name="detail" className="p-6" onSubmit={addToCart}>
						<div className="flex justify-between">
							<div className="flex flex-col">
								<h2 className="mb-1 text-2xl font-bold">{selectedItem.name}</h2>
								<p className="mb-2">{selectedItem.description}</p>
							</div>
							<div className="flex flex-col items-center">
								<p className="text-xl font-bold">Base Price</p>
								<p className="text-2xl font-bold">${selectedItem.price}</p>
							</div>
						</div>
						<div className="flex flex-col mt-2">
							<h3 className="text-lg font-semibold">Size</h3>
							<div className="grid grid-cols-3 gap-4">
								{Object.keys(selectedItem.size).map((size, index) => (
									<div
										key={index}
										className={`flex flex-col rounded border-2 text-center ${size === selectedSize ? "border-green-500" : ""}`}
									>
										<label htmlFor={`size-${index}`} className="w-full py-1">
											{size}
											<br />
											(+${selectedItem.size[size]})
										</label>
										<input
											type="radio"
											name="detail"
											value={size}
											id={`size-${index}`}
											className="sr-only"
											onChange={() => setSelectedSize(size)}
											checked={size === selectedSize}
											required
										/>
									</div>
								))}
							</div>
						</div>
						<div className="mt-2">
							<h3 className="text-lg font-semibold">Add-Ons</h3>
							<div className="grid grid-cols-3 gap-4">
								{Object.keys(selectedItem.addOn).map((addOn, index) => (
									<div
										key={index}
										className={`flex flex-col rounded border-2 text-center ${selectedAddOns.includes(addOn) ? "border-green-500" : ""}`}
									>
										<label htmlFor={`addon-${index}`} className="w-full py-1">
											{addOn}
											<br />
											(+${selectedItem.addOn[addOn]})
										</label>
										<input
											type="checkbox"
											value={addOn}
											id={`addon-${index}`}
											className="hidden"
											onChange={(e) =>
												setSelectedAddOns(
													e.target.checked
														? [...selectedAddOns, addOn]
														: selectedAddOns.filter((a) => a !== addOn)
												)
											}
										/>
									</div>
								))}
							</div>
						</div>
						<div className="mt-6 flex justify-between">
							<div className="flex w-1/6 items-center">
								<button
									type="button"
									id="decrement-button"
									className="rounded-l-lg border-2 p-2"
									onClick={() => setQuantity(Math.max(1, quantity - 1))}
								>
									-
								</button>
								<input
									type="text"
									id="quantity-input"
									value={quantity}
									className="w-full border-y-2 p-2 text-center"
									required
									readOnly
								/>
								<button
									type="button"
									id="increment-button"
									className="rounded-r-lg border-2 p-2"
									onClick={() => setQuantity(quantity + 1)}
								>
									+
								</button>
							</div>
							<div className="flex">
								<button
									type="button"
									onClick={() => setShowAddToCart(false)}
									className="rounded bg-red-500 px-4 py-2 text-white"
								>
									Cancel
								</button>
								<button type="submit" className="ml-4 rounded bg-green-500 px-4 py-2 text-white">
									Add to Cart
								</button>
							</div>
						</div>
					</form>
				</Modal>
			)}
			{showCart && (
				<Modal onClose={() => setShowCart(false)}>
					<div className="p-6">
						<div className="flex justify-between">
							<h2 className="mb-4 text-3xl font-bold">Cart</h2>
							<h2 className="mb-4 text-xl">Table: {params.table}</h2>
						</div>
						<table className="w-full">
							<thead>
								<tr>
									<th className="text-left">No.</th>
									<th className="text-left">Item</th>
									<th className="text-left">Quantity</th>
									<th className="text-left">Price</th>
								</tr>
							</thead>
							<tbody>
								{cartItems.length === 0 ? (
									<tr>
										<td className="border-2 p-2 text-center">-</td>
										<td className="border-2 p-2 text-center">-</td>
										<td className="border-2 p-2 text-center">-</td>
										<td className="border-2 p-2 text-center">-</td>
									</tr>
								) : (
									cartItems.map((cartItem, index) => {
										const { name, size, addOn, quantity, price } = cartItem;
										return (
											<tr key={index + 1}>
												<td className="border-2 p-2 text-center">{index + 1}</td>
												<td className="border-2 p-2">
													<b>{name} </b>({size}
													{addOn.length > 0 && <span>, {addOn.join(", ")}</span>})
												</td>
												<td className="border-2 p-2">{quantity}</td>
												<td className="border-2 p-2">${(price * quantity).toFixed(2)}</td>
												<td className="w-10 border-2 p-2 text-center">
													<button
														className="mx-auto w-8 cursor-pointer rounded bg-red-500 py-2"
														onClick={() => handleRemoveItem(index)}
													>
														<IoTrashBin color="white" size={18} className="mx-auto" />
													</button>
												</td>
											</tr>
										);
									})
								)}
							</tbody>
						</table>
						<div className="mt-6 flex justify-between">
							<p className="text-2xl font-bold">Total: ${totalCartPrice.toFixed(2)}</p>
							<div className="flex">
								<button
									onClick={() => setShowCart(false)}
									className="rounded bg-red-600 px-6 py-2 text-white"
								>
									Close
								</button>
								<button
									className="ml-4 rounded bg-green-500 px-4 py-2 text-white"
									onClick={orderSubmit}
								>
									Order
								</button>
							</div>
						</div>
					</div>
				</Modal>
			)}
			{showBill && (
				<Modal onClose={() => setShowBill(false)}>
					<div className="p-6">
						<div className="flex justify-between">
							<h2 className="mb-4 text-3xl font-bold">Bill</h2>
							<h2 className="mb-4 text-xl">Table: {params.table}</h2>
						</div>
						<table className="w-full">
							<thead>
								<tr>
									<th className="text-left">No.</th>
									<th className="text-left">Item</th>
									<th className="text-left">Quantity</th>
									<th className="text-left">Price</th>
								</tr>
							</thead>
							<tbody>
								{billItems.length === 0 ? (
									<tr>
										<td className="border-2 p-2 text-center">-</td>
										<td className="border-2 p-2 text-center">-</td>
										<td className="border-2 p-2 text-center">-</td>
										<td className="border-2 p-2 text-center">-</td>
									</tr>
								) : (
									billItems.map((billItem, index) => (
										<tr key={index + 1}>
											<td className="border-2 p-2 text-center">{index + 1}</td>
											<td className="border-2 p-2">
												<b>{billItem.name} </b>({billItem.size}
												{billItem.addOn.length > 0 && (
													<span>, {billItem.addOn.join(", ")}</span>
												)}
												)
											</td>
											<td className="border-2 p-2">{billItem.quantity}</td>
											<td className="border-2 p-2">
												${(billItem.price * billItem.quantity).toFixed(2)}
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
						<div className="mt-6 flex justify-between">
							<p className="text-2xl font-bold">Total: ${totalBillPrice.toFixed(2)}</p>
							<div className="flex">
								<button
									onClick={() => setShowBill(false)}
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
			{showService && (
				<>
					<div className="fixed inset-0 z-40 m-auto h-fit w-1/3 overflow-auto rounded-xl bg-white shadow-lg">
						<div className="rounded p-6">
							<div className="flex justify-between text-2xl font-bold">
								<h2>Service</h2>
								<h2>Table: {params.table}</h2>
							</div>
							<div className="flex my-10 justify-center">
								<h2 className="text-4xl font-bold">Call the staff?</h2>
							</div>
							<div className="flex justify-end">
								<button
									onClick={() => {
										setShowService(false);
									}}
									className="rounded bg-red-500 p-2 text-white"
								>
									Cancel
								</button>
								<button
									onClick={() => {
										setShowService(false);
										socket.emit("sendNotification", "Service", params.table);
									}}
									className="ml-2 rounded bg-green-500 p-2 text-white"
								>
									Call
								</button>
							</div>
						</div>
					</div>
					<div
						onClick={() => setShowService(false)}
						className="fixed inset-0 z-30 flex items-center justify-center bg-black bg-opacity-50"
					></div>
				</>
			)}
			<nav className="fixed bottom-0 flex w-full">
				<div
					className="flex w-1/4 cursor-pointer justify-center bg-yellow-200 py-2"
					onClick={() => setShowService(true)}
				>
					<IoNotifications size={24} />
					<p className="ml-2">Service</p>
				</div>
				<div
					className="flex w-1/4 cursor-pointer justify-center bg-gray-200 py-2"
					onClick={() => setShowBill(true)}
				>
					<RiBillFill size={24} />
					<p className="ml-2">Bill</p>
				</div>
				<div
					className="flex w-1/2 cursor-pointer justify-center bg-green-300 py-2"
					onClick={() => setShowCart(true)}
				>
					<p className="mr-2">Cart</p>
					<IoCart size={24} />
				</div>
			</nav>
		</>
	);
};

export default OrderPage;
