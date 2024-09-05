"use client";

import React, { useState, useEffect } from "react";

import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { fetchData, handleSort, sortedData } from "@/lib/utils";

import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	PointElement,
	LineElement,
	Legend,
	Tooltip,
} from "chart.js";
import "chart.js/auto";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Legend, Tooltip);

const SalesPage = () => {
	const [orders, setOrders] = useState([]);
	const [itemsSales, setItemsSales] = useState([]);
	const [categoriesSales, setCategorySales] = useState([]);
	const [itemChartInstance, setItemChartInstance] = useState(null);
	const [categoryChartInstance, setCategoryChartInstance] = useState(null);
	const [itemSortConfig, setItemitemSortConfig] = useState({
		key: "totalSales",
		direction: "descending",
	});
	const [categorySortConfig, setCategoryitemSortConfig] = useState({
		key: "totalSales",
		direction: "descending",
	});

	useEffect(() => {
		const fetchDataAndSetState = async () => {
			const data = await fetchData("order");
			setOrders(data);
		};

		fetchDataAndSetState();
	}, []);

	useEffect(() => {
		if (!orders.length) return;

		const processedData = orders.reduce((acc, order) => {
			order.items.forEach((item) => {
				const existingItem = acc.find((i) => i.name === item.name);
				if (existingItem) {
					existingItem.quantity += item.quantity;
					existingItem.totalSales += item.quantity * item.price;
				} else {
					acc.push({
						name: item.name,
						quantity: item.quantity,
						totalSales: item.quantity * item.price,
					});
				}
			});
			return acc;
		}, []);

		const sortedData = processedData.sort((a, b) => b.totalSales - a.totalSales);

		setItemsSales(sortedData);
	}, [orders]);

	const sortedItems = sortedData(itemsSales, itemSortConfig);

	useEffect(() => {
		const processedData = orders.reduce((acc, order) => {
			order.items.forEach((item) => {
				const existingCategory = acc.find((c) => c.category === item.category);
				if (existingCategory) {
					existingCategory.quantity += item.quantity;
					existingCategory.totalSales += item.quantity * item.price;
				} else {
					acc.push({
						category: item.category,
						quantity: item.quantity,
						totalSales: item.quantity * item.price,
					});
				}
			});
			return acc;
		}, []);

		const sortedData = processedData.sort((a, b) => b.totalSales - a.totalSales);

		setCategorySales(sortedData);
	}, [orders]);

	const sortedCategories = sortedData(categoriesSales, categorySortConfig);

	useEffect(() => {
		if (!itemsSales.length) return;

		if (itemChartInstance) {
			itemChartInstance.destroy();
		}

		const ctxItems = document.getElementById("itemsChart").getContext("2d");
		const newChartInstance = new ChartJS(ctxItems, {
			type: "pie",
			data: {
				labels: itemsSales.map((item) => item.name),
				datasets: [
					{
						label: "Item Sales",
						data: itemsSales.map((item) => item.totalSales),
						backgroundColor: generateRandomColors(itemsSales.length),
						borderWidth: 1,
					},
				],
			},
			options: {
				responsive: true,
				plugins: {
					legend: {
						position: "bottom",
					},
				},
			},
		});
		setItemChartInstance(newChartInstance);

		return () => {
			if (newChartInstance) {
				newChartInstance.destroy();
			}
		};
	}, [itemsSales]);

	useEffect(() => {
		if (!categoriesSales.length) return;

		if (categoryChartInstance) {
			categoryChartInstance.destroy();
		}

		const ctxCategories = document.getElementById("categoriesChart").getContext("2d");
		const newChartInstance = new ChartJS(ctxCategories, {
			type: "pie",
			data: {
				labels: categoriesSales.map((category) => category.category),
				datasets: [
					{
						label: "Category Sales",
						data: categoriesSales.map((category) => category.totalSales),
						backgroundColor: generateRandomColors(categoriesSales.length),
						borderWidth: 1,
					},
				],
			},
			options: {
				responsive: true,
				plugins: {
					legend: {
						position: "bottom",
					},
				},
			},
		});
		setCategoryChartInstance(newChartInstance);

		return () => {
			if (newChartInstance) {
				newChartInstance.destroy();
			}
		};
	}, [categoriesSales]);

	const generateRandomColors = (count) => {
		const colors = [];
		const baseHue = Math.floor(Math.random() * 360);
		const saturation = 60;
		const lightness = 60;

		for (let i = 0; i < count; i++) {
			const hueVariation = (i * 137.508) % 360;
			const hue = (baseHue + hueVariation) % 360;

			const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
			colors.push(color);
		}

		return colors;
	};

	return (
		<>
			<div className="flex gap-10">
				<div className="w-1/2">
					<h1 className="text-2xl font-bold mb-2">Item Sales</h1>
					<div className="mx-auto w-1/2">
						<canvas id="itemsChart" />
					</div>
					<div className="overflow-x-auto">
						<table className="min-w-full table-auto border border-gray-200 bg-white">
							<thead>
								<tr>
									<th
										className="cursor-pointer border bg-gray-100 py-2 px-4"
										onClick={() => handleSort("name", itemSortConfig, setItemitemSortConfig)}
									>
										<div className="flex justify-between items-center">
											Item
											{itemSortConfig.key === "name" ? (
												itemSortConfig.direction === "ascending" ? (
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
										className="cursor-pointer border bg-gray-100 py-2 px-4"
										onClick={() => handleSort("quantity", itemSortConfig, setItemitemSortConfig)}
									>
										<div className="flex justify-between items-center">
											Quantity Sold
											{itemSortConfig.key === "quantity" ? (
												itemSortConfig.direction === "ascending" ? (
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
										className="cursor-pointer border bg-gray-100 py-2 px-4"
										onClick={() => handleSort("totalSales", itemSortConfig, setItemitemSortConfig)}
									>
										<div className="flex justify-between items-center">
											Total Sales ($)
											{itemSortConfig.key === "totalSales" ? (
												itemSortConfig.direction === "ascending" ? (
													<FaSortUp />
												) : (
													<FaSortDown />
												)
											) : (
												<FaSort />
											)}
										</div>
									</th>
								</tr>
							</thead>
							<tbody>
								{sortedItems.map((item, index) => (
									<tr key={index}>
										<td className="w-1/3 border px-4 py-2">{item.name}</td>
										<td className="w-1/3 border px-4 py-2">{item.quantity}</td>
										<td className="w-1/3 border px-4 py-2">${item.totalSales.toFixed(2)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
				<div className="w-1/2">
					<h2 className="text-2xl font-bold mb-2">Category Sales</h2>
					<div className="mx-auto w-1/2">
						<canvas id="categoriesChart" />
					</div>
					<table className="min-w-full table-auto border border-gray-200 bg-white mb-4">
						<thead>
							<tr>
								<th
									className="cursor-pointer border bg-gray-100 py-2 px-4"
									onClick={() =>
										handleSort("category", categorySortConfig, setCategoryitemSortConfig)
									}
								>
									<div className="flex justify-between items-center">
										Category
										{categorySortConfig.key === "category" ? (
											categorySortConfig.direction === "ascending" ? (
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
									className="cursor-pointer border bg-gray-100 py-2 px-4"
									onClick={() =>
										handleSort("quantity", categorySortConfig, setCategoryitemSortConfig)
									}
								>
									<div className="flex justify-between items-center">
										Quantity Sold
										{categorySortConfig.key === "quantity" ? (
											categorySortConfig.direction === "ascending" ? (
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
									className="cursor-pointer border bg-gray-100 py-2 px-4"
									onClick={() =>
										handleSort("totalSales", categorySortConfig, setCategoryitemSortConfig)
									}
								>
									<div className="flex justify-between items-center">
										Total Sales ($)
										{categorySortConfig.key === "totalSales" ? (
											categorySortConfig.direction === "ascending" ? (
												<FaSortUp />
											) : (
												<FaSortDown />
											)
										) : (
											<FaSort />
										)}
									</div>
								</th>
							</tr>
						</thead>
						<tbody>
							{sortedCategories.map((category, index) => (
								<tr key={index}>
									<td className="w-1/3 border px-4 py-2">{category.category}</td>
									<td className="w-1/3 border px-4 py-2">{category.quantity}</td>
									<td className="w-1/3 border px-4 py-2">${category.totalSales.toFixed(2)}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</>
	);
};

export default SalesPage;
