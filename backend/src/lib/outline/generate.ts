import { createAnthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import { getKeypointExamples, keyPointStyleGuidelines } from "./style";

export type ModelChoice = "haiku-4-5" | "sonnet-4-5" | "opus-4-5";

const MODEL_IDS: Record<ModelChoice, string> = {
	"haiku-4-5": "claude-haiku-4-5",
	"sonnet-4-5": "claude-sonnet-4-5",
	"opus-4-5": "claude-opus-4-5",
};

const getModel = (apiKey?: string, model: ModelChoice = "haiku-4-5") => {
	const client = apiKey ? createAnthropic({ apiKey }) : createAnthropic();
	return client(MODEL_IDS[model]);
};

const semanticSectionSchema = z.object({
	keyPoint: z.string().describe(keyPointStyleGuidelines("section")),
	startChunk: z
		.number()
		.describe("The chunk integer where this semantic section starts"),
	endChunk: z
		.number()
		.describe("The chunk integer where this semantic section ends"),
});

const chapterOutlineSchema = z.object({
	sections: z.array(semanticSectionSchema),
});

type AiChapterOutline = z.infer<typeof chapterOutlineSchema>;

const keyDetailSchema = z.object({
	text: z.string().describe(keyPointStyleGuidelines("detail")),
	startChunk: z
		.number()
		.describe("The chunk number where this key detail starts"),
});

const sectionDetailsSchema = z.object({
	details: z.array(keyDetailSchema),
});

type AiSectionDetails = z.infer<typeof sectionDetailsSchema>;

export async function generateChapterOutline(
	chapterText: string,
	chapterTitle: string,
	chapterKeyPoint: string,
	apiKey?: string,
	model?: ModelChoice,
): Promise<AiChapterOutline> {
	// Skip if chapter text is too short (less than 500 characters, ~100 words)
	if (!chapterText || chapterText.trim().length < 500) {
		return { sections: [] };
	}
	console.log(`🤖 [START] Generate chapter outline for ${chapterTitle}`);

	try {
		const { object } = await generateObject({
			model: getModel(apiKey, model),
			temperature: 0.3,
			prompt: `Break this chapter into 3-7 semantic sections with complete coverage and no gaps, flowing one after the other.
Each semantic section has a key point and a start and end chunk number.
Each section should span one or more complete chunks.

${getKeypointExamples()}

Chapter: ${chapterTitle}
Chapter key point: ${chapterKeyPoint}

Text: ${chapterText}`,
			schema: chapterOutlineSchema,
		});

		console.log(`✅ [END] Generate chapter outline for ${chapterTitle}`);
		return object;
	} catch (error) {
		console.error(
			`❌ [ERROR] Generate chapter outline for ${chapterTitle}`,
			error,
		);
		return { sections: [] };
	}
}

export async function generateSectionDetails(
	sectionText: string,
	chapterTitle: string,
	sectionDescription: string,
	startChunk: number,
	endChunk: number,
	apiKey?: string,
	model?: ModelChoice,
): Promise<AiSectionDetails> {
	console.log(`🤖 [START] Generate section details for ${sectionDescription}`);
	try {
		const { object } = await generateObject({
			model: getModel(apiKey, model),
			temperature: 0.3,
			prompt: `Given this key point: "${sectionDescription}"

Extract 3-7 supporting details that ENRICH and EXPAND on this key point without repeating it. 
This could be a direct quote from the text, a paraphrase, or a summarized insight.
Adjacent key details in this section should also be included.

The text includes chunk markers in the format {{ CHUNK X }}. For each key detail, identify the chunk number where that detail appears, and ensure the startChunk is between ${startChunk} and ${endChunk}.

Chapter title: ${chapterTitle}
Section text: ${sectionText}`,
			schema: sectionDetailsSchema,
		});

		console.log(`✅ [END] Generate section details for ${sectionDescription}`);
		return object;
	} catch (error) {
		console.error(
			`❌ [ERROR] Generate section details for ${sectionDescription}`,
			error,
		);
		return { details: [] };
	}
}
