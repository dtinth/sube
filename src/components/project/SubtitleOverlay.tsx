import React, { useImperativeHandle, useRef } from "react";
import { EditableSubtitle } from "./TimelineComponents";
import { getRowTopPosition } from "./TimelineComponents";

interface SubtitleOverlayProps {
  timelineRows: Array<{
    subtitles: Array<{
      index: number;
      text: string;
      startOffsetInRow: number;
      width: number;
      start: number;
      end: number;
    }>;
  }>;
  activeSubtitleId: string | null;
  rowHeight: number;
  rowGap: number;
}

export interface SubtitleOverlayRef {
  editActiveSubtitle: () => boolean;
}

const SubtitleOverlay = React.forwardRef<SubtitleOverlayRef, SubtitleOverlayProps>(
  ({ timelineRows, activeSubtitleId, rowHeight, rowGap }, ref) => {
    // Create a map of refs to access each subtitle component
    const subtitleRefs = useRef<Map<string, React.RefObject<any>>>(new Map());
    
    // Initialize refs for each subtitle
    React.useEffect(() => {
      subtitleRefs.current.clear();
      
      timelineRows.forEach(row => {
        row.subtitles.forEach(subtitle => {
          const key = subtitle.index.toString();
          if (!subtitleRefs.current.has(key)) {
            subtitleRefs.current.set(key, React.createRef());
          }
        });
      });
    }, [timelineRows]);
    
    // Expose methods to parent components
    useImperativeHandle(ref, () => ({
      editActiveSubtitle: () => {
        if (activeSubtitleId && subtitleRefs.current.has(activeSubtitleId)) {
          const subtitleRef = subtitleRefs.current.get(activeSubtitleId);
          if (subtitleRef?.current) {
            subtitleRef.current.startEditing();
            return true;
          }
        }
        return false;
      }
    }));

    return (
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      >
        {timelineRows.map((row, rowIndex) => {
          const rowTop = getRowTopPosition(rowIndex, rowHeight, rowGap);

          return row.subtitles.map((subtitle) => (
            <EditableSubtitle
              key={`all-${subtitle.index}`}
              subtitle={subtitle}
              isActive={activeSubtitleId === subtitle.index.toString()}
              rowTop={rowTop}
              rowHeight={rowHeight}
              ref={subtitleRefs.current.get(subtitle.index.toString())}
            />
          ));
        })}
      </div>
    );
  }
);

export default SubtitleOverlay;