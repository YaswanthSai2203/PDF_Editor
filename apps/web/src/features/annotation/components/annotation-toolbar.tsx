"use client";

import {
  Highlighter,
  MousePointer2,
  Redo2,
  StickyNote,
  Trash2,
  Undo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AnnotationTool } from "@/features/annotation/domain/annotation";

interface AnnotationToolbarProps {
  activeTool: AnnotationTool;
  onToolChange: (tool: AnnotationTool) => void;
  canDeleteSelection: boolean;
  onDeleteSelection: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export function AnnotationToolbar({
  activeTool,
  onToolChange,
  canDeleteSelection,
  onDeleteSelection,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: AnnotationToolbarProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        size="icon"
        variant="outline"
        onClick={onUndo}
        aria-label="Undo annotation change"
        title="Undo"
        disabled={!canUndo}
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="outline"
        onClick={onRedo}
        aria-label="Redo annotation change"
        title="Redo"
        disabled={!canRedo}
      >
        <Redo2 className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant={activeTool === "SELECT" ? "secondary" : "outline"}
        onClick={() => onToolChange("SELECT")}
        aria-label="Select tool"
        title="Select"
      >
        <MousePointer2 className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant={activeTool === "HIGHLIGHT" ? "secondary" : "outline"}
        onClick={() => onToolChange("HIGHLIGHT")}
        aria-label="Highlight tool"
        title="Highlight"
      >
        <Highlighter className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant={activeTool === "NOTE" ? "secondary" : "outline"}
        onClick={() => onToolChange("NOTE")}
        aria-label="Note tool"
        title="Note"
      >
        <StickyNote className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="outline"
        onClick={onDeleteSelection}
        aria-label="Delete selected annotation"
        title="Delete selected"
        disabled={!canDeleteSelection}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
