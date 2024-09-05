import { NextResponse } from "next/server";
import { connectMongoDB } from "/lib/mongodb";
import Item from "/models/item";

import fs from "fs";
import path from "path";
import { pipeline } from "stream";
import { promisify } from "util";
import { log } from "console";

const pump = promisify(pipeline);

export async function POST(req) {
	try {
		const data = await req.formData();
		const image = data.get("image");
		const item = JSON.parse(data.get("item"));

		await connectMongoDB();

		if (image) {
			const imagePath = path.join(process.cwd(), "public", item.image);
			await pump(image.stream(), fs.createWriteStream(imagePath));
		}

		await Item.create(item);

		return NextResponse.json({ message: "Item added." }, { status: 201 });
	} catch (error) {
		return NextResponse.json({ message: "An error occured while adding the item" }, { status: 500 });
	}
}

export async function GET() {
	try {
		await connectMongoDB();
		const items = await Item.find();

		return NextResponse.json(items);
	} catch (error) {
		return NextResponse.json({ message: "An error occured while fetch items" }, { status: 500 });
	}
}

export async function PUT(req) {
	try {
		const data = await req.formData();
		const image = data.get("image");
		const lastImage = data.get("lastImage");
		const item = JSON.parse(data.get("item"));

		await connectMongoDB();

		if (image) {
			const lastImagePath = path.join(process.cwd(), "public", lastImage);
			const imagePath = path.join(process.cwd(), "public", item.image);

			fs.unlink(lastImagePath, (err) => {
				if (err) {
					console.error(`Error removing image: ${err}`);
					return;
				}

				console.log(`Image has been successfully removed.`);
			});

			await pump(image.stream(), fs.createWriteStream(imagePath));
		}

		await Item.findOneAndUpdate({ _id: item._id }, item, {
			new: true,
			runValidators: true,
		});

		return NextResponse.json({ message: "Item updated." }, { status: 200 });
	} catch (error) {
		return NextResponse.json({ message: "An error occured while updating Item." }, { status: 500 });
	}
}

export async function DELETE(req) {
	try {
		const { _id, image } = await req.json();
		await connectMongoDB();

		const imagePath = path.join(process.cwd(), "public", image);

		fs.unlink(imagePath, (err) => {
			if (err) {
				console.error(`Error removing image: ${err}`);
				return;
			}

			console.log(`Image has been successfully removed.`);
		});

		await Item.findOneAndDelete({ _id: _id });

		return NextResponse.json({ message: "Item deleted." }, { status: 200 });
	} catch (error) {
		return NextResponse.json({ message: "An error occured while deleting Item." }, { status: 500 });
	}
}
