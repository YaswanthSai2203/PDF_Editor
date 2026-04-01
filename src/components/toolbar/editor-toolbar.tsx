"use client";

import {
  MousePointer2,
  Hand,
  Highlighter,
  Underline,
  Strikethrough,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Pen,
  Type,
  MessageSquare,
  Stamp,
  Image as ImageIcon,
  Eraser,
  PenLine,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  Undo,
  Redo,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAnnotationStore } from "@/stores/annotation.store";
import { useDocumentStore } from "@/stores/document.store";
import type { AnnotationTool } from "@/types/annotation";

interface ToolButtonProps {
  tool: AnnotationTool;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  activeTool: AnnotationTool;
  onSelect: (tool: AnnotationTool) => void;
  shortcut?: string;
}

function ToolButton({
  tool,
  label,
  icon: Icon,
  activeTool,
  onSelect,
  shortcut,
}: ToolButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={activeTool === tool ? "secondary" : "ghost"}
          size="icon"
          className={cn(
            "h-8 w-8",
            activeTool === tool && "bg-primary/10 text-primary"
          )}
          onClick={() => onSelect(tool)}
          aria-label={label}
          aria-pressed={activeTool === tool}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <span>{label}</span>
        {shortcut && (
          <kbd className="ml-2 text-[10px] opacity-60">{shortcut}</kbd>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

const annotationTools: Array<{
  tool: AnnotationTool;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
}> = [
  { tool: "SELECT", label: "Select", icon: MousePointer2, shortcut: "V" },
  { tool: "PAN", label: "Pan / Hand", icon: Hand, shortcut: "H" },
];

const markupTools: typeof annotationTools = [
  { tool: "HIGHLIGHT", label: "Highlight", icon: Highlighter, shortcut: "L" },
  { tool: "UNDERLINE", label: "Underline", icon: Underline, shortcut: "U" },
  { tool: "STRIKETHROUGH", label: "Strikethrough", icon: Strikethrough },
];

const shapeTools: typeof annotationTools = [
  { tool: "RECTANGLE", label: "Rectangle", icon: Square, shortcut: "R" },
  { tool: "ELLIPSE", label: "Ellipse / Circle", icon: Circle, shortcut: "O" },
  { tool: "LINE", label: "Line", icon: Minus },
  { tool: "ARROW", label: "Arrow", icon: ArrowRight },
  { tool: "FREEHAND", label: "Freehand draw", icon: Pen, shortcut: "P" },
];

const contentTools: typeof annotationTools = [
  { tool: "TEXT", label: "Text box", icon: Type, shortcut: "T" },
  { tool: "COMMENT", label: "Comment / Note", icon: MessageSquare },
  { tool: "STAMP", label: "Stamp", icon: Stamp },
  { tool: "IMAGE", label: "Insert image", icon: ImageIcon },
  { tool: "SIGNATURE", label: "Signature", icon: PenLine },
];

const utilityTools: typeof annotationTools = [
  { tool: "ERASER", label: "Eraser", icon: Eraser, shortcut: "E" },
];

interface EditorToolbarProps {
  documentTitle?: string;
  isSaving?: boolean;
}

export function EditorToolbar({
  documentTitle,
  isSaving,
}: EditorToolbarProps) {
  const { activeTool, toolSettings, actions: annotationActions } =
    useAnnotationStore();
  const {
    currentPage,
    totalPages,
    scale,
    actions: docActions,
  } = useDocumentStore();

  return (
    <TooltipProvider delayDuration={400}>
      <div className="flex items-center gap-1 h-12 px-2 border-b border-border bg-background overflow-x-auto shrink-0">
        {/* Document actions */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Undo"
              >
                <Undo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo (⌘Z)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Redo"
              >
                <Redo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo (⌘⇧Z)</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-5 mx-1" />

        {/* Select / Pan */}
        {annotationTools.map((t) => (
          <ToolButton
            key={t.tool}
            {...t}
            activeTool={activeTool}
            onSelect={annotationActions.setActiveTool}
          />
        ))}

        <Separator orientation="vertical" className="h-5 mx-1" />

        {/* Markup */}
        {markupTools.map((t) => (
          <ToolButton
            key={t.tool}
            {...t}
            activeTool={activeTool}
            onSelect={annotationActions.setActiveTool}
          />
        ))}

        <Separator orientation="vertical" className="h-5 mx-1" />

        {/* Shapes */}
        {shapeTools.map((t) => (
          <ToolButton
            key={t.tool}
            {...t}
            activeTool={activeTool}
            onSelect={annotationActions.setActiveTool}
          />
        ))}

        <Separator orientation="vertical" className="h-5 mx-1" />

        {/* Content */}
        {contentTools.map((t) => (
          <ToolButton
            key={t.tool}
            {...t}
            activeTool={activeTool}
            onSelect={annotationActions.setActiveTool}
          />
        ))}

        <Separator orientation="vertical" className="h-5 mx-1" />

        {/* Utility */}
        {utilityTools.map((t) => (
          <ToolButton
            key={t.tool}
            {...t}
            activeTool={activeTool}
            onSelect={annotationActions.setActiveTool}
          />
        ))}

        {/* Color picker */}
        <Separator orientation="vertical" className="h-5 mx-1" />
        <Tooltip>
          <TooltipTrigger asChild>
            <label className="relative cursor-pointer">
              <div
                className="h-6 w-6 rounded-md border-2 border-border shadow-sm"
                style={{ backgroundColor: toolSettings.color }}
              />
              <input
                type="color"
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                value={toolSettings.color}
                onChange={(e) =>
                  annotationActions.updateToolSettings({ color: e.target.value })
                }
                aria-label="Annotation color"
              />
            </label>
          </TooltipTrigger>
          <TooltipContent>Color</TooltipContent>
        </Tooltip>

        {/* Stroke width */}
        <div className="flex items-center gap-1.5 ml-1 min-w-[90px]">
          <span className="text-[10px] text-muted-foreground shrink-0">Stroke</span>
          <Slider
            min={1}
            max={10}
            step={0.5}
            value={[toolSettings.strokeWidth]}
            onValueChange={([v]) =>
              annotationActions.updateToolSettings({ strokeWidth: v })
            }
            className="w-14"
            aria-label="Stroke width"
          />
        </div>

        <Separator orientation="vertical" className="h-5 mx-1" />

        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => docActions.setCurrentPage(currentPage - 1)}
                disabled={currentPage <= 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Previous page</TooltipContent>
          </Tooltip>

          <div className="flex items-center gap-1">
            <Input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) =>
                docActions.setCurrentPage(Number(e.target.value))
              }
              className="h-7 w-12 text-center text-xs px-1"
              aria-label="Current page"
            />
            <span className="text-xs text-muted-foreground">
              / {totalPages}
            </span>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => docActions.setCurrentPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Next page</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-5 mx-1" />

        {/* Zoom controls */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={docActions.zoomOut}
                aria-label="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom out (−)</TooltipContent>
          </Tooltip>

          <button
            className="text-xs tabular-nums w-12 text-center hover:bg-accent rounded px-1 py-0.5"
            onClick={docActions.resetZoom}
            aria-label="Reset zoom"
          >
            {Math.round(scale * 100)}%
          </button>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={docActions.zoomIn}
                aria-label="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom in (+)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={docActions.rotateCW}
                aria-label="Rotate clockwise"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Rotate clockwise (R)</TooltipContent>
          </Tooltip>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side actions */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5">
                <Share2 className="h-3.5 w-3.5" />
                Share
              </Button>
            </TooltipTrigger>
            <TooltipContent>Share document</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export PDF</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                className="h-8 gap-1.5"
                disabled={isSaving}
              >
                <Save className="h-3.5 w-3.5" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save (⌘S)</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
