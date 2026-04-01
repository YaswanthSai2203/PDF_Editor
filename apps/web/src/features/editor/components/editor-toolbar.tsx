"use client";

import {
  Image as ImageIcon,
  MousePointer2,
  Redo2,
  Trash2,
  Type,
  Undo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { EditorTool } from "@/features/editor/domain/editor-element";

interface EditorToolbarProps {
  activeTool: EditorTool;
  onToolChange: (tool: EditorTool) => void;
  canDeleteSelection: boolean;
  onDeleteSelection: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export function EditorToolbar({
  activeTool,
  onToolChange,
  canDeleteSelection,
  onDeleteSelection,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: EditorToolbarProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        size="icon"
        variant="outline"
        onClick={onUndo}
        aria-label="Undo editor change"
        title="Undo"
        disabled={!canUndo}
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="outline"
        onClick={onRedo}
        aria-label="Redo editor change"
        title="Redo"
        disabled={!canRedo}
      >
        <Redo2 className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant={activeTool === "SELECT" ? "secondary" : "outline"}
        onClick={() => onToolChange("SELECT")}
        aria-label="Select editor tool"
        title="Select"
      >
        <MousePointer2 className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant={activeTool === "TEXT" ? "secondary" : "outline"}
        onClick={() => onToolChange("TEXT")}
        aria-label="Text editor tool"
        title="Text"
      >
        <Type className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant={activeTool === "IMAGE" ? "secondary" : "outline"}
        onClick={() => onToolChange("IMAGE")}
        aria-label="Image editor tool"
        title="Image"
      >
        <ImageIcon className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="outline"
        onClick={onDeleteSelection}
        aria-label="Delete selected editor element"
        title="Delete selected"
        disabled={!canDeleteSelection}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
