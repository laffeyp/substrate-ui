// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The outline 24a's inspector draws (moved from editor/Centre.tsx in sprint 476): classes and functions (TypeScript,
// JavaScript, Python, C, C++), structs (C, C++), top-level keys (JSON), headings (Markdown), selectors (CSS), each with
// its 1-based first and last line; a row inside a class or struct one deeper.

import type { EditorState } from "@codemirror/state";
import { ensureSyntaxTree } from "@codemirror/language";
import type { SyntaxNode } from "@lezer/common";

export type OutlineRow = { kind: string; name: string; line: number; end: number; depth: number };

const OUTLINE_NODES: Record<string, string> = {
  ClassDeclaration: "class", FunctionDeclaration: "fn", MethodDeclaration: "fn", ClassDefinition: "class", FunctionDefinition: "fn",
  ClassSpecifier: "class", StructSpecifier: "struct",
  ATXHeading1: "h1", ATXHeading2: "h2", ATXHeading3: "h3", SetextHeading1: "h1", SetextHeading2: "h2", RuleSet: "rule",
};
/** A name among a node's direct children (JavaScript, TypeScript, Python; a C or C++ struct's or class's tag). */
const NAME_NODES = new Set(["VariableDefinition", "PropertyDefinition", "VariableName", "TypeDefinition", "TypeIdentifier"]);
/** What a C or C++ function declarator holds as its name. */
const DECLARATOR_NAMES = new Set(["Identifier", "FieldIdentifier", "ScopedIdentifier", "DestructorName", "OperatorName"]);

/** A C or C++ struct or class is listed only where it is defined, with a body; `struct point p;` is not. */
const listed = (n: SyntaxNode) => !(n.name === "StructSpecifier" || n.name === "ClassSpecifier") || !!n.getChild("FieldDeclarationList");
const container = (n: SyntaxNode) => { const k = OUTLINE_NODES[n.name]; return (k === "class" || k === "struct") && listed(n); };

/** A C or C++ function's name: the name in its declarator, through any pointer or reference declarators. */
function declaratorName(fn: SyntaxNode): SyntaxNode | null {
  const find = (n: SyntaxNode): SyntaxNode | null => {
    if (n.name === "FunctionDeclarator") {
      for (let c = n.firstChild; c; c = c.nextSibling) if (DECLARATOR_NAMES.has(c.name)) return c;
      return null;
    }
    if (!/Declarator$/.test(n.name)) return null;
    for (let c = n.firstChild; c; c = c.nextSibling) { const f = find(c); if (f) return f; }
    return null;
  };
  for (let c = fn.firstChild; c; c = c.nextSibling) { const f = find(c); if (f) return f; }
  return null;
}

export function outlineOf(state: EditorState): OutlineRow[] {
  const tree = ensureSyntaxTree(state, state.doc.length, 500);
  if (!tree) return [];
  const out: OutlineRow[] = [];
  const isJson = tree.type.name === "JsonText";
  const depthOf = (n: SyntaxNode) => { let d = 0; for (let p = n.parent; p; p = p.parent) if (container(p)) d++; return d; };
  tree.iterate({
    enter: (ref) => {
      const node = ref.node;
      if (isJson && node.name === "Property" && node.parent?.parent?.name === "JsonText") {
        const key = node.getChild("PropertyName");
        if (key) out.push({ kind: "key", name: state.doc.sliceString(key.from, key.to).replace(/^"|"$/g, ""), line: state.doc.lineAt(node.from).number, end: state.doc.lineAt(node.to).number, depth: 0 });
        return false;
      }
      const kind = OUTLINE_NODES[node.name];
      if (!kind || !listed(node)) return undefined;
      let name = "";
      if (kind.startsWith("h")) name = state.doc.sliceString(node.from, node.to).replace(/^#+\s*/, "").split("\n")[0];
      else if (kind === "rule") name = state.doc.sliceString(node.from, node.to).split("{")[0].trim();
      else {
        let c = node.firstChild; while (c && !NAME_NODES.has(c.name)) c = c.nextSibling;
        if (!c && kind === "fn") c = declaratorName(node);
        name = c ? state.doc.sliceString(c.from, c.to) : "";
      }
      out.push({ kind, name, line: state.doc.lineAt(node.from).number, end: state.doc.lineAt(node.to).number, depth: depthOf(node) });
      return kind === "fn" ? false : undefined;
    },
  });
  return out;
}
