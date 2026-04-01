"use client";

import { useMemo, useState } from "react";
import { Plus, Send, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  SignatureRecipientEntity,
  SignatureRecipientInput,
  SignatureRequestEntity,
} from "@/features/signature/domain/signature-request";

interface SignaturePanelProps {
  requests: SignatureRequestEntity[];
  selectedRequestId: string | null;
  selectedRequest?: SignatureRequestEntity | null;
  onSelectRequest: (requestId: string) => void;
  onCreateRequest: (input: {
    title: string;
    message?: string;
    recipients: SignatureRecipientInput[];
  }) => void;
  onUpdateRequest: (
    requestId: string,
    updates: {
      title?: string;
      message?: string;
      recipients?: SignatureRecipientInput[];
    },
  ) => void;
  onSendRequest: (requestId: string) => void;
}

function renderRecipientLine(recipient: SignatureRecipientEntity): string {
  const label = recipient.displayName?.trim() || recipient.email;
  return `${label} (${recipient.status})`;
}

export function SignaturePanel({
  requests,
  selectedRequestId,
  selectedRequest: selectedRequestProp,
  onSelectRequest,
  onCreateRequest,
  onUpdateRequest,
  onSendRequest,
}: SignaturePanelProps) {
  const selectedRequest =
    selectedRequestProp ??
    requests.find((request) => request.id === selectedRequestId) ??
    null;
  const recipients = selectedRequest?.recipients ?? [];
  const [titleDraft, setTitleDraft] = useState<string>("");
  const [messageDraft, setMessageDraft] = useState<string>("");
  const [recipientNameDraft, setRecipientNameDraft] = useState<string>("");
  const [recipientEmailDraft, setRecipientEmailDraft] = useState<string>("");
  const selectedRequestIdMemo = selectedRequest?.id ?? null;
  const titleValue = useMemo(
    () => (selectedRequestIdMemo ? titleDraft || selectedRequest?.title || "" : titleDraft),
    [selectedRequest?.title, selectedRequestIdMemo, titleDraft],
  );
  const messageValue = useMemo(
    () =>
      selectedRequestIdMemo
        ? messageDraft || selectedRequest?.message || ""
        : messageDraft,
    [messageDraft, selectedRequest?.message, selectedRequestIdMemo],
  );

  function persistDraftFields(next: { title?: string; message?: string }): void {
    if (!selectedRequest) {
      return;
    }
    onUpdateRequest(selectedRequest.id, {
      title: next.title ?? titleValue,
      message: next.message ?? messageValue,
    });
  }

  function handleCreateDraft(): void {
    const title = titleValue.trim();
    if (!title) {
      return;
    }
    onCreateRequest({
      title,
      message: messageValue.trim() || undefined,
      recipients: [],
    });
    setRecipientNameDraft("");
    setRecipientEmailDraft("");
  }

  function handleAddRecipient(): void {
    if (!selectedRequest) {
      return;
    }
    const email = recipientEmailDraft.trim();
    if (!email) {
      return;
    }
    const nextRecipients: SignatureRecipientInput[] = [
      ...selectedRequest.recipients.map((recipient) => ({
        email: recipient.email,
        displayName: recipient.displayName,
        signingOrder: recipient.signingOrder,
      })),
      {
        email,
        displayName: recipientNameDraft.trim() || undefined,
        signingOrder: selectedRequest.recipients.length + 1,
      },
    ];
    onUpdateRequest(selectedRequest.id, { recipients: nextRecipients });
    setRecipientNameDraft("");
    setRecipientEmailDraft("");
  }

  function handleRemoveRecipient(recipientId: string): void {
    if (!selectedRequest) {
      return;
    }
    const nextRecipients: SignatureRecipientInput[] = selectedRequest.recipients
      .filter((recipient) => recipient.id !== recipientId)
      .map((recipient, index) => ({
        email: recipient.email,
        displayName: recipient.displayName,
        signingOrder: index + 1,
      }));
    onUpdateRequest(selectedRequest.id, { recipients: nextRecipients });
  }

  const canSend = Boolean(
    selectedRequest && selectedRequest.status === "DRAFT" && recipients.length > 0,
  );

  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <div className="border-b border-zinc-200 px-3 py-3 dark:border-zinc-800">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Signature workflow
          </h3>
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={handleCreateDraft}
          >
            <Plus className="h-4 w-4" />
            Draft
          </Button>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Create draft requests, add recipients, and send.
        </p>
      </div>

      <div className="grid min-h-0 grid-rows-[200px_1fr]">
        <div className="space-y-2 overflow-y-auto border-b border-zinc-200 p-3 dark:border-zinc-800">
          {requests.length === 0 ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              No signature requests yet.
            </p>
          ) : (
            requests.map((request) => (
              <button
                key={request.id}
                type="button"
                className={`w-full rounded-md border px-2 py-2 text-left text-xs ${
                  request.id === selectedRequestId
                    ? "border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-800"
                    : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900"
                }`}
                onClick={() => onSelectRequest(request.id)}
              >
                <div className="font-medium text-zinc-800 dark:text-zinc-100">
                  {request.title}
                </div>
                <div className="text-zinc-500 dark:text-zinc-400">{request.status}</div>
              </button>
            ))
          )}
        </div>

        <div className="min-h-0 space-y-3 overflow-y-auto p-3">
          <div className="space-y-2">
            <label className="text-xs text-zinc-600 dark:text-zinc-300">Request title</label>
            <Input
              value={titleValue}
              onChange={(event) => setTitleDraft(event.target.value)}
              onBlur={() => persistDraftFields({ title: titleValue })}
              placeholder="e.g. Client contract signature"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-zinc-600 dark:text-zinc-300">Message</label>
            <textarea
              className="min-h-20 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-0 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              value={messageValue}
              onChange={(event) => setMessageDraft(event.target.value)}
              onBlur={() => persistDraftFields({ message: messageValue })}
              placeholder="Please review and sign this document."
            />
          </div>

          <div className="space-y-2 rounded-md border border-zinc-200 p-2 dark:border-zinc-800">
            <div className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
              Add recipient
            </div>
            <Input
              value={recipientNameDraft}
              onChange={(event) => setRecipientNameDraft(event.target.value)}
              placeholder="Recipient name"
            />
            <Input
              value={recipientEmailDraft}
              onChange={(event) => setRecipientEmailDraft(event.target.value)}
              placeholder="recipient@email.com"
              type="email"
            />
            <Button size="sm" variant="outline" onClick={handleAddRecipient}>
              Add recipient
            </Button>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
              Recipients ({recipients.length})
            </div>
            {recipients.length === 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Add at least one recipient before sending.
              </p>
            ) : (
              recipients.map((recipient) => (
                <div
                  key={recipient.id}
                  className="flex items-center justify-between rounded border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700"
                >
                  <span className="truncate text-zinc-700 dark:text-zinc-200">
                    {renderRecipientLine(recipient)}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => handleRemoveRecipient(recipient.id)}
                    aria-label="Remove recipient"
                    title="Remove recipient"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>

          <Button
            size="sm"
            className="gap-1"
            disabled={!canSend}
            onClick={() => selectedRequest && onSendRequest(selectedRequest.id)}
          >
            <Send className="h-4 w-4" />
            Send request
          </Button>
        </div>
      </div>
    </div>
  );
}
