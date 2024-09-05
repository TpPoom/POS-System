import { NextResponse } from "next/server";
import { connectMongoDB } from "/lib/mongodb";
import Order from "/models/order";

export async function GET() {
	try {
		await connectMongoDB();

		const startOfToday = new Date();
		startOfToday.setHours(0, 0, 0, 0);

		const startOfTomorrow = new Date(startOfToday);
		startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

		const orders = await Order.find({
			updatedAt: {
				$gte: startOfToday,
				$lt: startOfTomorrow,
			},
		});

		return NextResponse.json(orders);
	} catch (error) {
		return NextResponse.json(
			{ message: "An error occurred while fetching orders", error: error.message },
			{ status: 500 }
		);
	}
}

export async function PUT(req) {
	try {
		const { id, itemId, status } = await req.json();
		await connectMongoDB();

		await Order.findOneAndUpdate(
			{ id: id, "items._id": itemId },
			{
				$set: { "items.$.status": status },
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
