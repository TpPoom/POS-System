import Link from "next/link";

import Navbar from "@/components/Navbar";

export default function Layout({ children }) {
	return (
		<>
			<Navbar>
				<ul className="flex space-x-10">
					<li className="cursor-pointer font-bold">
						<Link href="/staff">Home</Link>
					</li>
					<li className="cursor-pointer font-bold">
						<Link href="/staff/orders/All">Order</Link>
					</li>
					<li className="cursor-pointer font-bold">
						<Link href="/staff/items">Item</Link>
					</li>
					<li className="cursor-pointer font-bold">
						<Link href="/staff/bills">Bill</Link>
					</li>
				</ul>
			</Navbar>
			<div className="flex grow flex-col px-12 py-6">{children}</div>
		</>
	);
}
