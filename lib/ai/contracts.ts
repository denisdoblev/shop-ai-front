import type { components } from "@/lib/api/generated";

type GeneratedAiChatSource = components["schemas"]["AiDocumentSourceDto"];

export type AiChatSource = Omit<
  GeneratedAiChatSource,
  "pageStart" | "pageEnd" | "section"
> & {
  pageStart: number | null;
  pageEnd: number | null;
  section: string | null;
};

export type AiChatRequest = components["schemas"]["ChatRequestDto"];

export type AiChatResponse = Omit<
  components["schemas"]["ChatResponseDto"],
  "sources"
> & { sources: AiChatSource[] };

export type AiChatErrorResponse = {
  message: string;
  statusCode: number;
};
