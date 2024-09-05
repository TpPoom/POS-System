"use server";
import fs from "fs";
import path from "path";

export const update = (data) => {
	fs.writeFileSync(path.join(process.cwd(), "src/store.json"), JSON.stringify(data));
};
