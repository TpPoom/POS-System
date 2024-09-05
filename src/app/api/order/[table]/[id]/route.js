import { NextResponse } from "next/server";
import { connectMongoDB } from "/lib/mongodb";
import Order from "/models/order";

export async function GET(req, { params }) {
	try {
		const { id, table } = params;

		await connectMongoDB();
		const order = await Order.findOne({
			$and: [{ id: id }, { table: table }],
		});

		if (!order) {
			return NextResponse.json({ redirect: true }, { status: 404 });
		}

		return NextResponse.json(order);
	} catch (error) {
		return NextResponse.json({ message: "An error occured while fetch order" }, { status: 500 });
	}
}

export async function POST(req, { params }) {
	try {
		await connectMongoDB();

		await Order.create({ id: params.id, table: params.table });

		return NextResponse.json({ message: "Order added." }, { status: 201 });
	} catch (error) {
		console.error("Error adding order:", error.message);
		return NextResponse.json({ message: "An error occurred while adding the order" }, { status: 500 });
	}
}

export async function PUT(req, { params }) {
	try {
		const { id } = params;
		const { items } = await req.json();
		await connectMongoDB();

		await Order.findOneAndUpdate(
			{ id: id },
			{
				$push: { items: items },
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

export async function DELETE(req, { params }) {
	try {
		const { itemId } = await req.json();
		const { id, table } = params;

		await connectMongoDB();

		const updatedOrder = await Order.findOneAndUpdate(
			{ id: id, table: table },
			{ $pull: { items: { _id: itemId } } },
			{ new: true, runValidators: true }
		);

		if (!updatedOrder) {
			return NextResponse.json({ message: "Order not found" }, { status: 404 });
		}

		return NextResponse.json({ message: "Item removed and order updated." }, { status: 200 });
	} catch (error) {
		return NextResponse.json({ message: "An error occurred while removing the item" }, { status: 500 });
	}
}
