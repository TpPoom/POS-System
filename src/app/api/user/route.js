import { NextResponse } from "next/server";
import { connectMongoDB } from "../../../../lib/mongodb";
import User from "../../../../models/user";
import bcrypt from "bcryptjs";

export async function POST(req) {
	try {
		const { name, id, role, username, password } = await req.json();
		const hashedPassword = await bcrypt.hash(password, 10);
		await connectMongoDB();
		const nameFounded = await User.findOne({ name }).select("_id");
		const usernameFounded = await User.findOne({ username }).select("_id");

		if (nameFounded != null || usernameFounded != null) {
			return NextResponse.json({ message: "User already exists." }, { status: 302 }, { ok: false });
		}

		await User.create({ name, id, role, username, password: hashedPassword });

		return NextResponse.json({ message: "User registered." }, { status: 201 });
	} catch (error) {
		return NextResponse.json({ message: "An error occured while registrating the user" }, { status: 500 });
	}
}

export async function GET() {
	try {
		await connectMongoDB();
		const users = await User.find();

		return NextResponse.json(users);
	} catch (error) {
		return NextResponse.json({ message: "An error occured while fetch users" }, { status: 500 });
	}
}

export async function PUT(req) {
	try {
		const { _id, role, id, name, username } = await req.json();

		await User.findOneAndUpdate(
			{ _id: _id },
			{ role, id, name, username },
			{
				new: true,
				runValidators: true,
			}
		);

		return NextResponse.json({ message: "User updated." }, { status: 200 });
	} catch (error) {
		return NextResponse.json({ message: "An error occured while updating User." }, { status: 500 });
	}
}

export async function DELETE(req) {
	try {
		await connectMongoDB();
		const { _id } = await req.json();
		await User.findOneAndDelete({ _id: _id });

		return NextResponse.json({ message: "Item deleted." }, { status: 200 });
	} catch (error) {
		return NextResponse.json({ message: "An error occured while deleting Item." }, { status: 500 });
	}
}
