import mongoose, { Schema } from "mongoose";

const itemSchema = new Schema({
	category: {
		type: String,
		required: true,
	},
	name: {
		type: String,
		required: true,
	},
	size: {
		type: String,
		required: true,
	},
	addOn: {
		type: [String],
	},
	quantity: {
		type: Number,
		required: true,
	},
	price: {
		type: Number,
		required: true,
	},
	status: {
		type: String,
		enum: ["Pending", "Ongoing", "Completed"],
		default: "Pending",
	},
});

const orderSchema = new Schema(
	{
		id: {
			type: String,
			required: true,
			unique: true,
		},
		table: {
			type: String,
			required: true,
		},
		status: {
			type: String,
			enum: ["Pending", "Paid"],
			default: "Pending",
		},
		items: [itemSchema],
	},
	{ timestamps: true }
);

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;
