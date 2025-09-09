import React, { useRef, useState, useEffect, useCallback } from 'react';

interface AssetImgViewerProps {
  base64Img?: string | null;
}

const AssetImgViewer: React.FC<AssetImgViewerProps> = ({ base64Img }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // --- Reset zoom and position when base64Img changes
  useEffect(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, [base64Img]);

  // --- Global mouse move and mouse up
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStart) return;
      setTranslate({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    };

    const handleMouseUp = () => {
      setDragStart(null);
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  // --- Handle wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      // e.preventDefault();

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Zoom in/out
      const newScale = Math.min(Math.max(0.5, scale - e.deltaY * 0.01), 3);
      const scaleRatio = newScale / scale;

      const newTranslateX = mouseX - scaleRatio * (mouseX - translate.x);
      const newTranslateY = mouseY - scaleRatio * (mouseY - translate.y);

      setScale(newScale);
      setTranslate({ x: newTranslateX, y: newTranslateY });
    },
    [scale, translate]
  );

  // --- Start dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default browser behavior (like text selection)
    setDragStart({ x: e.clientX - translate.x, y: e.clientY - translate.y });
    setIsDragging(true);
  };

  if (!base64Img) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
    >
      <img
        ref={imgRef}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        src={base64Img}
        alt="Asset"
        style={{
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          position: 'absolute',
          top: 0,
          left: 0,
          transition: isDragging ? 'none' : 'transform 0.1s',
        }}
      />
    </div>
  );
};

export default AssetImgViewer;
