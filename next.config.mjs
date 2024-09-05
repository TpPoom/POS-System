/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: false,
	images: {
		domains: ["api.qrserver.com"], // Make sure this is added
	},
};

export default nextConfig;
