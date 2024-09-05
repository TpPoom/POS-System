"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";

import Link from "next/link";

import { fetchData } from "@/lib/utils";
import { FaArrowAltCircleRight } from "react-icons/fa";
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

const DashboardPage = () => {
	const [bills, setBills] = useState([]);
	const [items, setItems] = useState([]);
	const [tables, setTables] = useState([]);
	const [sales, setSales] = useState([]);
	const [selectedPeriod, setSelectedPeriod] = useState("Daily");
	const [selectedMonth, setSelectedMonth] = useState(new Date());
	const [selectedYear, setSelectedYear] = useState(new Date());
	const [minMonth, setMinMonth] = useState(new Date());
	const [maxMonth, setMaxMonth] = useState(new Date());

	useEffect(() => {
		const fetchDataAndSetState = async () => {
			const [billsData, itemsData, tablesData] = await Promise.all([
				fetchData("order"),
				fetchData("item"),
				fetchData("table"),
			]);

			if (billsData) {
				let newMinMonth = new Date();
				let newMaxMonth = new Date(billsData[0].updatedAt);

				const updatedOrders = billsData.map((order) => {
					const updatedTotal = order.items.reduce((total, item) => total + item.price * item.quantity, 0);

					const orderDate = new Date(order.updatedAt);

					if (orderDate < newMinMonth) {
						newMinMonth = orderDate;
					}
					if (orderDate > newMaxMonth) {
						newMaxMonth = orderDate;
					}

					setMinMonth(newMinMonth);
					setMaxMonth(newMaxMonth);
					setSelectedMonth(newMaxMonth);
					setSelectedYear(newMaxMonth);

					return { ...order, total: updatedTotal };
				});

				setBills(updatedOrders);
			}

			setItems(itemsData);
			setTables(tablesData);
		};

		fetchDataAndSetState();
	}, []);

	useEffect(() => {
		const generateDailySales = () => {
			const days = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();

			const daysInMonth = Array.from({ length: days }, (_, index) => {
				const day = index + 1;
				return `${selectedMonth.toISOString().slice(0, 7)}-${day.toString().padStart(2, "0")}`;
			});

			const sales = bills.reduce((acc, bill) => {
				const billDate = new Date(bill.updatedAt);

				console.log(billDate.getMonth());
				console.log(selectedMonth.getMonth());
				if (
					billDate.getMonth() === selectedMonth.getMonth() &&
					billDate.getFullYear() === selectedMonth.getFullYear()
				) {
					const date = billDate.toISOString().split("T")[0];

					if (!acc[date]) acc[date] = 0;
					acc[date] += bill.total;
				}

				return acc;
			}, {});

			return daysInMonth.map((day) => ({
				day,
				sales: sales[day] || 0,
			}));
		};

		const generateMonthlySales = () => {
			const months = Array.from({ length: 12 }, (_, index) => {
				const month = new Date(selectedYear.getFullYear(), index + 1, 1);
				return month.toISOString().slice(0, 7);
			});

			const sales = bills.reduce((acc, bill) => {
				const billDate = new Date(bill.updatedAt);
				const month = billDate.toISOString().slice(0, 7);

				if (!acc[month]) acc[month] = 0;
				acc[month] += bill.total;

				return acc;
			}, {});

			return months.map((month) => ({
				month,
				sales: sales[month] || 0,
			}));
		};

		const generateYearlySales = () => {
			const years = Array.from({ length: 5 }, (_, index) => maxMonth.getFullYear() - (4 - index));

			const sales = bills.reduce((acc, bill) => {
				const billDate = new Date(bill.updatedAt);
				const year = billDate.getFullYear();

				if (!acc[year]) acc[year] = 0;
				acc[year] += bill.total;

				return acc;
			}, {});

			return years.map((year) => ({
				year: year.toString(),
				sales: sales[year] || 0,
			}));
		};

		if (selectedPeriod === "Daily") {
			const dailySalesArray = generateDailySales();
			setSales(dailySalesArray);
		} else if (selectedPeriod === "Monthly") {
			const monthlySalesArray = generateMonthlySales();
			setSales(monthlySalesArray);
		} else if (selectedPeriod === "Yearly") {
			const yearlySalesArray = generateYearlySales();
			setSales(yearlySalesArray);
		}
	}, [bills, selectedMonth, selectedYear, selectedPeriod, maxMonth]);

	const chartOptions = useMemo(
		() => ({
			responsive: true,
			scales: {
				x: {
					title: {
						display: true,
						text: selectedPeriod === "Daily" ? "Day" : selectedPeriod === "Monthly" ? "Month" : "Year",
					},
					grid: {
						display: false,
					},
				},
				y: {
					title: {
						display: true,
						text: "Sales",
					},
				},
			},
		}),
		[selectedPeriod]
	);

	const chartData = useMemo(
		() => ({
			labels: sales.map((item) =>
				selectedPeriod === "Daily"
					? String(item.day).slice(8, 10)
					: selectedPeriod === "Monthly"
					? String(item.month).slice(5, 7)
					: item.year
			),
			datasets: [
				{
					label: `${selectedPeriod} Sales`,
					data: sales.map((item) => item.sales),
					backgroundColor: "rgba(34, 197, 94 , 0.2)",
					borderColor: "rgba(34, 197, 94 , 1)",
					borderWidth: 1,
				},
			],
		}),
		[sales, selectedPeriod]
	);

	useEffect(() => {
		const ctx = document.getElementById("salesChart").getContext("2d");
		const chart = new ChartJS(ctx, {
			type: "bar",
			data: chartData,
			options: chartOptions,
		});

		return () => {
			chart.destroy();
		};
	}, [chartData, chartOptions]);

	return (
		<>
			<div className="grid grid-cols-4 gap-4">
				<Link
					href="manager/sales"
					className="flex cursor-pointer justify-between rounded-lg bg-green-200 shadow-md"
				>
					<div className="flex flex-col px-6 pt-6">
						<h3 className="mb-2 text-lg font-bold">Total Sales</h3>
						<p className="text-xl font-semibold">
							${bills.reduce((acc, order) => acc + order.total, 0).toFixed(2)}
						</p>
					</div>
					<div className="flex flex-col justify-center border-l-2 px-4 text-center">
						<p>More</p>
						<p>Info</p>
						<FaArrowAltCircleRight className="mx-auto mt-2" />
					</div>
				</Link>
				<Link
					href="manager/bills"
					className="flex cursor-pointer justify-between rounded-lg bg-blue-200 shadow-md"
				>
					<div className="flex flex-col p-6">
						<h3 className="mb-2 text-lg font-bold">Number of Bills</h3>
						<p className="text-xl font-semibold">{bills.length}</p>
					</div>
					<div className="flex flex-col justify-center border-l-2 px-4 text-center">
						<p>More</p>
						<p>Info</p>
						<FaArrowAltCircleRight className="mx-auto mt-2" />
					</div>
				</Link>
				<Link
					href="manager/items"
					className="flex cursor-pointer justify-between rounded-lg bg-yellow-200 shadow-md"
				>
					<div className="flex flex-col p-6">
						<h3 className="mb-2 text-lg font-bold">Number of Items</h3>
						<p className="text-xl font-semibold">{items.length}</p>
					</div>
					<div className="flex flex-col justify-center border-l-2 px-4 text-center">
						<p>More</p>
						<p>Info</p>
						<FaArrowAltCircleRight className="mx-auto mt-2" />
					</div>
				</Link>
				<Link
					href="manager/tables"
					className="flex cursor-pointer justify-between rounded-lg bg-red-200 shadow-md"
				>
					<div className="flex flex-col p-6">
						<h3 className="mb-2 text-lg font-bold">Number of Tables</h3>
						<p className="text-xl font-semibold">{tables.length}</p>
					</div>
					<div className="flex flex-col justify-center border-l-2 px-4 text-center">
						<p>More</p>
						<p>Info</p>
						<FaArrowAltCircleRight className="mx-auto mt-2" />
					</div>
				</Link>
			</div>
			<div className="flex flex-col mt-8 h-[60vh] w-full">
				<div className="flex justify-between">
					<h3 className="text-2xl font-bold">Sales Chart</h3>
					<div className="flex gap-2">
						{selectedPeriod == "Daily" && (
							<input
								type="month"
								value={selectedMonth.toISOString().slice(0, 7)}
								onChange={(e) => setSelectedMonth(new Date(e.target.value))}
								className="rounded border-2 px-2"
								min={minMonth.toISOString().slice(0, 7)}
								max={maxMonth.toISOString().slice(0, 7)}
							/>
						)}
						{selectedPeriod === "Monthly" && (
							<input
								type="number"
								value={selectedYear.getFullYear()}
								onChange={(e) => setSelectedYear(new Date(e.target.value, selectedYear.getMonth(), 1))}
								className="rounded border-2 px-2"
								min={minMonth.getFullYear()}
								max={maxMonth.getFullYear()}
							/>
						)}
						{["Daily", "Monthly", "Yearly"].map((period) => (
							<div
								key={period}
								className={`flex rounded border-2 text-center w-20 items-center ${
									period === selectedPeriod ? "border-green-500" : ""
								}`}
							>
								<label htmlFor={period} className="w-full">
									{period}
								</label>
								<input
									type="radio"
									name="period"
									value={period}
									id={period}
									className="sr-only"
									onChange={() => setSelectedPeriod(period)}
									checked={period === selectedPeriod}
									required
								/>
							</div>
						))}
					</div>
				</div>
				<canvas id="salesChart" className="max-h-full" />
			</div>
		</>
	);
};

export default DashboardPage;
