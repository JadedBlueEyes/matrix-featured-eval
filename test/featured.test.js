const assert = require("node:assert/strict");
const test = require("node:test");

const {
	createSeededRandom,
	evaluateFeaturedServerRules,
	evaluateFeaturedServerSet,
	FEATURED_SERVER_ENDPOINT,
	UNSTABLE_FEATURED_SERVER_ENDPOINT,
} = require("../dist/index.cjs.js");

test("exports the stable and unstable endpoints", () => {
	assert.equal(FEATURED_SERVER_ENDPOINT, "/.well-known/matrix/featured");
	assert.equal(UNSTABLE_FEATURED_SERVER_ENDPOINT, "/.well-known/continuwuity/featured");
});

test("display threshold rejects values above the configured probability", () => {
	assert.equal(
		evaluateFeaturedServerRules(
			{ display: 0.5 },
			{ random: () => 0.5001 },
		),
		false,
	);
});

test("display threshold accepts values equal to the configured probability", () => {
	assert.equal(
		evaluateFeaturedServerRules(
			{ display: 0.5 },
			{ random: () => 0.5 },
		),
		true,
	);
});

test("locale rules respect primary language deny lists and spoken language allow lists", () => {
	assert.equal(
		evaluateFeaturedServerRules(
			{
				display: 1,
				languages: {
					allow: ["en", "fr"],
					deny: ["es"],
				},
			},
			{
				primaryLanguage: "es-ES",
				spokenLanguages: ["en-GB"],
				random: () => 1,
			},
		),
		false,
	);

	assert.equal(
		evaluateFeaturedServerRules(
			{
				display: 1,
				languages: {
					allow: ["en", "fr"],
				},
			},
			{
					spokenLanguages: ["de-DE", "fr"],
				random: () => 1,
			},
		),
		true,
	);
});

test("geo rules respect deny and allow lists", () => {
	assert.equal(
		evaluateFeaturedServerRules(
			{
				display: 1,
				geos: {
					allow: ["GB", "US"],
					deny: ["CN"],
				},
			},
			{ geo: "CN", random: () => 1 },
		),
		false,
	);

	assert.equal(
		evaluateFeaturedServerRules(
			{
				display: 1,
				geos: {
					allow: ["GB", "US"],
				},
			},
			{ geo: "gb", random: () => 1 },
		),
		true,
	);
});

test("seeded random values are reproducible", () => {
	const first = createSeededRandom("matrix");
	const second = createSeededRandom("matrix");

	assert.equal(first(), second());
	assert.equal(first(), second());
});

test("set evaluation filters servers that do not match their rules", () => {
	const servers = [
		{ name: "alpha", rules: { display: 1 } },
		{ name: "beta", rules: { display: 0 } },
		{ name: "gamma", rules: { display: 1, geos: { deny: ["CN"] } } },
		{ name: "delta" },
	];

	const visibleServers = evaluateFeaturedServerSet(
		servers,
		(server) => server.rules,
		{ geo: "GB", random: () => 1 },
	);

	assert.deepEqual(
		visibleServers.map((server) => server.name),
		["alpha", "gamma", "delta"],
	);
});

test("evaluation filters randomness works as expected", () => {
	const servers = [
		{ name: "alpha", rules: { display: 0.5 } },
		{ name: "beta", rules: { display: 0.5 } },
		{ name: "gamma", rules: { display: 0.5, geos: { deny: ["CN"] } } },
		{ name: "delta", rules: { display: 0.5 }  },
		{ name: "theta", rules: { display: 0.5 } },
		{ name: "omega", rules: { display: 0.5 } },
	];

	const visibleServers = evaluateFeaturedServerSet(
		servers,
		(server) => server.rules,
		{ geo: "GB", random: createSeededRandom("matrix")},
	);

	assert.deepEqual(
		visibleServers.map((server) => server.name),
		["alpha", "beta", "omega"],
	);
});
