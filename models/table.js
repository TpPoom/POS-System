import mongoose, { Schema } from "mongoose";

const tableSchema = new Schema(
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
		size: {
			type: Number,
			required: true,
		},
	},
	{ timestamps: true }
);

const Table = mongoose.models.Table || mongoose.model("Table", tableSchema);
export default Table;
