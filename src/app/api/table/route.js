import { NextResponse } from "next/server";
import { connectMongoDB } from "/lib/mongodb";
import Table from "/models/table";

export async function POST(req) {
	try {
		const data = await req.json();
		await connectMongoDB();

		await Table.create(data);

		return NextResponse.json({ message: "Table added." }, { status: 201 });
	} catch (error) {
		return NextResponse.json({ message: "An error occured while registrating the user" }, { status: 500 });
	}
}

export async function GET() {
	try {
		await connectMongoDB();
		const tables = await Table.find();

		return NextResponse.json(tables);
	} catch (error) {
		return NextResponse.json({ message: "An error occured while fetch tables" }, { status: 500 });
	}
}

export async function PUT(req) {
	try {
		const { _id, name, size } = await req.json();

		await connectMongoDB();

		await Table.findOneAndUpdate(
			{ _id: _id },
			{ name: name, size: size },
			{
				new: true,
				runValidators: true,
			}
		);

		return NextResponse.json({ message: "Table updated." }, { status: 200 });
	} catch (error) {
		return NextResponse.json({ message: "An error occured while updating Table." }, { status: 500 });
	}
}

export async function DELETE(req) {
	try {
		await connectMongoDB();
		const { _id } = await req.json();

		await Table.findOneAndDelete({ _id: _id });

		return NextResponse.json({ message: "Table deleted." }, { status: 200 });
	} catch (error) {
		return NextResponse.json({ message: "An error occured while deleting Table." }, { status: 500 });
	}
}
