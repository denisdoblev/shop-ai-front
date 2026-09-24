export type AiAskRequest = {
  productId: string;
  question: string;
};

export type AiAskSource = {
  chunkId: string;
  documentId: string;
  documentName: string;
  productId: string;
  chunkIndex: number;
  pageStart: number | null;
  pageEnd: number | null;
  section: string | null;
};

export type AiAskResponse = {
  answer: string;
  sources: AiAskSource[];
};

export type AiAskErrorResponse = {
  message: string;
  statusCode: number;
};
