// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// A sent message's attachments as its row draws them (sprint 452; ADD-TO-MESSAGE-2026-11-10-r3, what you see): an
// attachment that went as its reference line, not its content, is marked. The server writes that line
// (server.py `_attachment_text`, sprint 446) opening with one of the two phrases below, the same constants there
// (ATTACH_NOT_INLINED, ATTACH_NOT_FOUND); tests/test_attachment_marks_452.py holds the two copies equal. No I/O.

export const NOT_INLINED = "(not inlined: ";
export const NOT_FOUND = "(not found when the message was sent: ";

export interface SentAttachment { kind: string; label: string; ref: string; text?: string }

/** Whether the attachment reached the model as its reference line rather than its content. */
export function byReference(a: SentAttachment): boolean {
  const text = a.text ?? "";
  return text.startsWith(NOT_INLINED) || text.startsWith(NOT_FOUND);
}

/** A chip's hover: its path, and for one sent by reference the server's line saying why. */
export function chipTitle(a: SentAttachment): string {
  return byReference(a) ? `${a.ref}\n${a.text}` : a.ref;
}
