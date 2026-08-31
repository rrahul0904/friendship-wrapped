import { analyzeThreadTale } from "./analyze";
import { MIN_CHAT_MESSAGES, tooFewMessagesError, validateRawChatText } from "./import-validation";
import { parseChatDetailed } from "./parser";
import type { WorkerRequest, WorkerResponse } from "./worker-protocol";

function decodeContent(request: Extract<WorkerRequest, { type: "ANALYZE_CHAT" }>) {
  return request.content.kind === "text"
    ? request.content.text
    : new TextDecoder().decode(request.content.buffer);
}

export function runAnalysisRequest(
  request: Extract<WorkerRequest, { type: "ANALYZE_CHAT" }>,
  emit: (response: WorkerResponse) => void,
) {
  try {
    emit({ type: "PROGRESS", requestId: request.requestId, stage: "validating" });
    const rawText = decodeContent(request);
    const inputError = validateRawChatText(rawText);
    if (inputError) {
      emit({
        type: "ERROR",
        requestId: request.requestId,
        error: { code: "INVALID_INPUT", message: inputError },
      });
      return;
    }

    emit({ type: "PROGRESS", requestId: request.requestId, stage: "parsing" });
    const parsed = parseChatDetailed(rawText, request.options.dateOrder);
    if (parsed.messages.length < MIN_CHAT_MESSAGES) {
      emit({
        type: "ERROR",
        requestId: request.requestId,
        error: { code: "TOO_FEW_MESSAGES", message: tooFewMessagesError(parsed.messages.length) },
      });
      return;
    }

    emit({
      type: "PROGRESS",
      requestId: request.requestId,
      stage: "analyzing",
      messageCount: parsed.messages.length,
    });
    const result = analyzeThreadTale(parsed);
    emit({ type: "PROGRESS", requestId: request.requestId, stage: "finalizing", messageCount: parsed.messages.length });
    emit({ type: "SUCCESS", requestId: request.requestId, result });
  } catch (cause) {
    emit({
      type: "ERROR",
      requestId: request.requestId,
      error: {
        code: "ANALYSIS_FAILED",
        message: cause instanceof Error ? cause.message : "Something went wrong while analyzing that export.",
      },
    });
  }
}
