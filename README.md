# matrix-featured-eval

A small TypeScript library for evaluating MSC4485 featured homeserver rules.

It implements the proposed `/.well-known/matrix/featured` endpoint semantics.

## Install

```bash
pnpm add matrix-featured-eval
```

## Usage

```ts
import {
	evaluateFeaturedServerRules,
	evaluateFeaturedServerSet,
	createSeededRandom,
	FEATURED_SERVER_ENDPOINT,
	UNSTABLE_FEATURED_SERVER_ENDPOINT,
} from "matrix-featured-eval";

const featured = evaluateFeaturedServerRules(
	{
		display: 0.5,
		languages: {
			allow: ["en", "fr"],
		},
		geos: {
			deny: ["CN"],
		},
	},
	{
		primaryLanguage: "en-US",
		spokenLanguages: ["en-US", "fr"],
		geo: "GB",
		random: createSeededRandom("user-123"),
	},
);

console.log(featured);
console.log(FEATURED_SERVER_ENDPOINT);
console.log(UNSTABLE_FEATURED_SERVER_ENDPOINT);

const visibleServers = evaluateFeaturedServerSet(
	[
		{ name: "alpha", rules: { display: 1 } },
		{ name: "beta", rules: { display: 0.25 } },
	],
	(server) => server.rules,
	{
		primaryLanguage: "en-US",
		geo: "GB",
		random: createSeededRandom("user-123"),
	},
);

console.log(visibleServers);
```

## API

### `evaluateFeaturedServerRules(rules, context?)`

Returns `true` when a homeserver should be shown, and `false` when it should be hidden.

The evaluator applies the MSC rules in order:

1. Reject invalid `display` values outside the range `0` to `1`.
2. Roll a per-user random value in the range `(0, 1]` and reject servers above the configured `display` probability.
3. Apply language allow and deny rules when language information is available.
4. Apply geo allow and deny rules when geo information is available.

### `evaluateFeaturedServerSet(servers, getRules, context?)`

Filters a list of servers down to the entries whose rules pass.

### `createSeededRandom(seed)`

Creates a deterministic random-number generator suitable for keeping featured lists stable for a given user or session.

### Exported constants

- `FEATURED_SERVER_ENDPOINT` is `/.well-known/matrix/featured`
- `UNSTABLE_FEATURED_SERVER_ENDPOINT` is `/.well-known/continuwuity/featured`

## Rule shape

```ts
type FeaturedServerRuleSet = {
	display: number;
	languages?: {
		allow?: readonly string[];
		deny?: readonly string[];
	};
	geos?: {
		allow?: readonly string[];
		deny?: readonly string[];
	};
};
```

Language codes should be BCP 47 tags. Geo codes should be ISO 3166-1 alpha-2 codes.

## Development

```bash
pnpm run build
pnpm test
pnpm lint
```

## License

[MIT](LICENSE)
