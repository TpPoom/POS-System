export const fetchData = async (api) => {
	try {
		const res = await fetch(`/api/${api}`);

		if (!res.ok) throw new Error("Failed to fetch data");

		return res.json();
	} catch (error) {
		console.error("Error fetching data:", error);
		return null;
	}
};

export const handleSort = (key, sortConfig, setSortConfig) => {
	let direction = "ascending";
	if (sortConfig.key === key && sortConfig.direction === "ascending") {
		direction = "descending";
	}
	setSortConfig({ key, direction });
};

export const sortedData = (data, sortConfig) => {
	return [...data].sort((a, b) => {
		if (a[sortConfig.key] < b[sortConfig.key]) {
			return sortConfig.direction === "ascending" ? -1 : 1;
		}
		if (a[sortConfig.key] > b[sortConfig.key]) {
			return sortConfig.direction === "ascending" ? 1 : -1;
		}
		return 0;
	});
};

export const handleSearch = (value, allData, setData) => {
	const searchedData = allData.filter((data) => data.name.toLowerCase().includes(value.toLowerCase()));
	setData(searchedData);
};
