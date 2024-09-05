import Container from "@/components/Container";

const Page = () => {
	return (
		<Container>
			<div className="flex grow justify-center items-center">
				<div className="flex-col space-y-2 text-center">
					<h1 className="w-full text-6xl font-bold">Thank you for visiting our site.</h1>
					<h1 className="w-full text-3xl font-bold">
						Unfortunately, the page you're looking for cannot be found.
					</h1>
				</div>
			</div>
		</Container>
	);
};

export default Page;
