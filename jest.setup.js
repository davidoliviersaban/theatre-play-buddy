// jest.setup.js
import '@testing-library/jest-dom'

// Polyfill TextEncoder/TextDecoder for Prisma and cuid2 in Jest environment
if (typeof global.TextEncoder === 'undefined') {
	const { TextEncoder, TextDecoder } = require('util');
	// @ts-ignore
	global.TextEncoder = TextEncoder;
	// @ts-ignore
	global.TextDecoder = TextDecoder;
}
