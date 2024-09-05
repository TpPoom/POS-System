import { NextResponse } from "next/server";
import { connectMongoDB } from "/lib/mongodb";

import Order from "/models/order";

export async function GET() {
	try {
		await connectMongoDB();
		const orders = await Order.find({
			status: "Pending",
		});

		const lastOrderId = (await Order.findOne().sort({ id: -1 })) || { id: "000000" };

		return NextResponse.json({ orders: orders, lastId: lastOrderId.id });
	} catch (error) {
		return NextResponse.json({ message: "An error occured while fetch order" }, { status: 500 });
	}
}

export async function PUT(req) {
	try {
		const { id } = await req.json();
		await connectMongoDB();

		await Order.findOneAndUpdate(
			{ id: id },
			{
				$set: { status: "Paid" },
			},
			{
				new: true,
				runValidators: true,
			}
		);

		return NextResponse.json({ message: "Order updated." }, { status: 201 });
	} catch (error) {
		console.error("Error adding order:", error.message);
		return NextResponse.json({ message: "An error occurred while adding the order" }, { status: 500 });
	}
}
