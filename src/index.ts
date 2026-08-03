export interface FeaturedServerRuleSet {
	display: number;
	languages?: FeaturedServerLocaleRules;
	geos?: FeaturedServerGeoRules;
}

export interface FeaturedServerLocaleRules {
	allow?: readonly string[];
	deny?: readonly string[];
}

export interface FeaturedServerGeoRules {
	allow?: readonly string[];
	deny?: readonly string[];
}

export interface FeaturedServerEvaluationContext {
	spokenLanguages?: readonly string[];
	primaryLanguage?: string;
	geo?: string;
	random?: () => number;
}

export const FEATURED_SERVER_ENDPOINT = "/.well-known/matrix/featured";
export const UNSTABLE_FEATURED_SERVER_ENDPOINT = "/.well-known/continuwuity/featured";

export function createSeededRandom(seed: string | number): () => number {
	let state = hashSeed(seed) || 0x6d2b79f5;

	return () => {
		state += 0x6d2b79f5;
		let value = state;
		value = Math.imul(value ^ (value >>> 15), value | 1);
		value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
		return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
	};
}

export function evaluateFeaturedServerRules(
	rules: FeaturedServerRuleSet,
	context: FeaturedServerEvaluationContext = {},
): boolean {
	if (!Number.isFinite(rules.display) || rules.display < 0 || rules.display > 1) {
		return false;
	}

	const roll = nextPositiveRoll(context.random ?? Math.random);
	if (roll > rules.display) {
		return false;
	}

	if (!matchesLocaleRules(rules.languages, context)) {
		return false;
	}

	if (!matchesGeoRules(rules.geos, context.geo)) {
		return false;
	}

	return true;
}

export function evaluateFeaturedServerSet<T>(
	servers: readonly T[],
	getRules: (server: T) => FeaturedServerRuleSet | undefined,
	context: FeaturedServerEvaluationContext = {},
): T[] {
	return servers.filter((server) => {
		const rules = getRules(server);
		return rules === undefined ? true : evaluateFeaturedServerRules(rules, context);
	});
}


function matchesLocaleRules(
	rules: FeaturedServerLocaleRules | undefined,
	context: FeaturedServerEvaluationContext,
): boolean {
	if (!rules) {
		return true;
	}

	const primaryLanguage = normalizeLanguageTag(context.primaryLanguage);
	const spokenLanguages = normalizeLanguageTags(context.spokenLanguages);

	if (primaryLanguage && normalizeLanguageTags(rules.deny).has(primaryLanguage)) {
		return false;
	}

	if (rules.allow !== undefined) {
		if (spokenLanguages === undefined) {
			return true;
		}

		const allowedLanguages = normalizeLanguageTags(rules.allow);
		if (!hasIntersection(spokenLanguages, allowedLanguages)) {
			return false;
		}
	}

	return true;
}

function matchesGeoRules(rules: FeaturedServerGeoRules | undefined, geo: string | undefined): boolean {
	if (!rules) {
		return true;
	}

	const normalizedGeo = normalizeGeoTag(geo);
	if (!normalizedGeo) {
		return true;
	}

	if (normalizeGeoTags(rules.deny).has(normalizedGeo)) {
		return false;
	}

	if (rules.allow !== undefined) {
		const allowedGeos = normalizeGeoTags(rules.allow);
		if (!allowedGeos.has(normalizedGeo)) {
			return false;
		}
	}

	return true;
}

function nextPositiveRoll(random: () => number): number {
	const candidate = random();
	if (!Number.isFinite(candidate) || candidate <= 0) {
		return Number.MIN_VALUE;
	}

	if (candidate > 1) {
		return 1;
	}

	return candidate;
}

function hasIntersection(left: Set<string>, right: Set<string>): boolean {
	for (const value of left) {
		if (right.has(value)) {
			return true;
		}
	}

	return false;
}

function normalizeLanguageTags(tags?: readonly string[]): Set<string> {
	const normalizedTags = new Set<string>();

	for (const tag of tags ?? []) {
		const normalizedTag = normalizeLanguageTag(tag);
		if (normalizedTag) {
			normalizedTags.add(normalizedTag);
		}
	}

	return normalizedTags;
}

function normalizeGeoTags(tags?: readonly string[]): Set<string> {
	const normalizedTags = new Set<string>();

	for (const tag of tags ?? []) {
		const normalizedTag = normalizeGeoTag(tag);
		if (normalizedTag) {
			normalizedTags.add(normalizedTag);
		}
	}

	return normalizedTags;
}

function normalizeLanguageTag(tag: string | undefined): string | undefined {
	if (!tag) {
		return undefined;
	}

	const normalizedTag = tag.trim().split("_").join("-");
	if (!normalizedTag) {
		return undefined;
	}

	return normalizedTag.toLowerCase();
}

function normalizeGeoTag(tag: string | undefined): string | undefined {
	if (!tag) {
		return undefined;
	}

	const normalizedTag = tag.trim();
	if (!normalizedTag) {
		return undefined;
	}

	return normalizedTag.toUpperCase();
}

function hashSeed(seed: string | number): number {
	const source = typeof seed === "number" ? String(seed) : seed;
	let hash = 2166136261;

	for (let index = 0; index < source.length; index += 1) {
		hash ^= source.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}

	return hash >>> 0;
}
