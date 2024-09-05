import mongoose, { Schema } from "mongoose";

const itemSchema = new Schema(
	{
		id: {
			type: String,
			required: true,
			unique: true,
		},
		name: {
			type: String,
			required: true,
		},
		category: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			required: true,
		},
		price: {
			type: Number,
			required: true,
		},
		image: {
			type: String,
			required: true,
		},
		size: {
			type: Map,
			of: Number,
		},
		addOn: {
			type: Map,
			of: Number,
		},
		status: {
			type: String,
			enum: ["In stock", "Out of stock"],
			default: "In stock",
			required: true,
		},
	},
	{ timestamps: true }
);

const Item = mongoose.models.Item || mongoose.model("Item", itemSchema);
export default Item;
