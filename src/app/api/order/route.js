import { NextResponse } from "next/server";
import { connectMongoDB } from "/lib/mongodb";
import Order from "/models/order";

export async function GET() {
	try {
		await connectMongoDB();
		const order = await Order.find();

		return NextResponse.json(order);
	} catch (error) {
		return NextResponse.json({ message: "An error occured while fetch order" }, { status: 500 });
	}
}
