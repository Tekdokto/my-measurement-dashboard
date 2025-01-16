import React, {
    createContext,
    useContext,
    useState,
    useRef,
    useEffect,
    useCallback,
    ReactNode,
  } from "react";
  import { RectangleData, SavedRecord } from "../types";
  
  /** The shape of the context value that the provider exposes. */
  interface CanvaContextValue {
    canvasRef: React.RefObject<HTMLCanvasElement>;
    rectangles: RectangleData[];
    savedRecords: SavedRecord[];
    selectedRecordId: string | null;
    isDrawing: boolean;
    isFiltered: boolean;
    handleMouseDown: (e: React.MouseEvent) => void;
    handleMouseMove: (e: React.MouseEvent) => void;
    handleMouseUp: (e: React.MouseEvent) => void;
    handleSave: () => void;
    handleClearCanvas: () => void;
    handleRowClick: (record: SavedRecord) => void;
    handleDeleteRecord: (id: string) => void;
    handleSort: (criterion: string) => void;
    handleFilter: (filter: string) => void;
    handleUndo: () => void; // Add this
    handleRedo: () => void; // Add this
  }
  
  /** Create a context for Canvas logic */
  const CanvaContext = createContext<CanvaContextValue | null>(null);
  
  /** Custom hook to use the Canvas context from anywhere */
  export const useCanva = (): CanvaContextValue => {
    const context = useContext(CanvaContext);
    if (!context) {
      throw new Error("useCanva must be used within a CanvaProvider");
    }
    return context;
  };
  
  /** A provider that encapsulates all canvas-related logic and state. */
  export const CanvaProvider = ({ children }: { children: ReactNode }) => {
    const [isFiltered, setIsFiltered] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
    // Rectangles + drawing states
    const [rectangles, setRectangles] = useState<RectangleData[]>([]);
    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
      null
    );
  
    // Undo/Redo Stacks
    const [undoStack, setUndoStack] = useState<RectangleData[][]>([]);
    const [redoStack, setRedoStack] = useState<RectangleData[][]>([]);
  
    // Saved data states
    const [savedRecords, setSavedRecords] = useState<SavedRecord[]>([]);
    const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  
    const originalRecordsRef = useRef<SavedRecord[]>([]);
  
    // Load data from local storage on initial load
    useEffect(() => {
        const data = localStorage.getItem("measurementData");
        if (data) {
            const parsedData = JSON.parse(data);
            setSavedRecords(parsedData);
            originalRecordsRef.current = parsedData; // Initialize original records
        }
    }, []);
    
    // Sync savedRecords with local storage whenever they change
    useEffect(() => {
        localStorage.setItem("measurementData", JSON.stringify(savedRecords));
        originalRecordsRef.current = [...savedRecords]; // Ensure original records stay updated
    }, [savedRecords]);
  
    const clearCanvasPixels = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }, []);
  
    const drawRectangle = (
      ctx: CanvasRenderingContext2D,
      rect: RectangleData,
      color: string
    ) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    };
  
    const redrawAll = useCallback(
        (rects: RectangleData[]) => {
          clearCanvasPixels();
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
      
          // Draw them in different colors
          if (rects[0]) drawRectangle(ctx, rects[0], "#FF0000"); // Red
          if (rects[1]) drawRectangle(ctx, rects[1], "#0066FF"); // Blue
        },
        [clearCanvasPixels]
    );
  
    const handleMouseDown = (e: React.MouseEvent) => {
      if (rectangles.length >= 2) return;
      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setIsDrawing(true);
      setStartPoint({ x, y });
    };
  
    const handleMouseUp = (e: React.MouseEvent) => {
      if (!isDrawing || !startPoint) return;
      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
      const endX = e.clientX - rect.left;
      const endY = e.clientY - rect.top;
  
      const width = endX - startPoint.x;
      const height = endY - startPoint.y;
  
      const newRect: RectangleData = {
        x: startPoint.x,
        y: startPoint.y,
        width,
        height,
      };
  
      setRectangles((prev) => {
        setUndoStack((u) => [...u, prev]);
        setRedoStack([]);
        return [...prev, newRect];
      });
  
      setIsDrawing(false);
      setStartPoint(null);
    };
  
    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDrawing || !startPoint) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
  
      clearCanvasPixels();
      redrawAll(rectangles);
  
      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      const width = currentX - startPoint.x;
      const height = currentY - startPoint.y;
  
      ctx.strokeStyle = "#008000"; // Green preview
      ctx.lineWidth = 2;
      ctx.strokeRect(startPoint.x, startPoint.y, width, height);
    };
  
    const calculateDistance = (r1: RectangleData, r2: RectangleData) => {
      const center1 = {
        x: r1.x + r1.width / 2,
        y: r1.y + r1.height / 2,
      };
      const center2 = {
        x: r2.x + r2.width / 2,
        y: r2.y + r2.height / 2,
      };
      return Math.sqrt(
        Math.pow(center2.x - center1.x, 2) + Math.pow(center2.y - center1.y, 2)
      );
    };
  
    const handleUndo = useCallback(() => {
      if (undoStack.length === 0) return;
      const prevRectangles = undoStack[undoStack.length - 1];
      setUndoStack((u) => u.slice(0, -1));
      setRedoStack((r) => [...r, rectangles]);
      setRectangles(prevRectangles);
    }, [undoStack, rectangles]);
  
    const handleRedo = useCallback(() => {
      if (redoStack.length === 0) return;
      const nextRectangles = redoStack[redoStack.length - 1];
      setRedoStack((r) => r.slice(0, -1));
      setUndoStack((u) => [...u, rectangles]);
      setRectangles(nextRectangles);
    }, [redoStack, rectangles]);
  
    const handleClearCanvas = useCallback(() => {
      setRectangles((prev) => {
        setUndoStack((u) => [...u, prev]);
        setRedoStack([]);
        return [];
      });
      clearCanvasPixels();
    }, [clearCanvasPixels]);
  
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        const ctrlOrMeta = e.ctrlKey || e.metaKey;
  
        if (ctrlOrMeta && e.key.toLowerCase() === "c") {
          e.preventDefault();
          handleClearCanvas();
        } else if (ctrlOrMeta && !e.shiftKey && e.key.toLowerCase() === "z") {
          e.preventDefault();
          handleUndo();
        } else if (ctrlOrMeta && e.shiftKey && e.key.toLowerCase() === "z") {
          e.preventDefault();
          handleRedo();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleClearCanvas, handleUndo, handleRedo]);
  
    const handleSave = () => {
        if (rectangles.length !== 2) {
          alert("Please draw exactly two rectangles before saving!");
          return;
        }
        const distance = calculateDistance(rectangles[0], rectangles[1]);
      
        const newRecord: SavedRecord = {
          id: crypto.randomUUID(),
          rectangles: rectangles,
          distance: parseFloat(distance.toFixed(2)),
          createdAt: new Date().toISOString(),
        };
      
        setSavedRecords((prev) => {
          const updatedRecords = [newRecord, ...prev];
          originalRecordsRef.current = updatedRecords; // Sync original records
          return updatedRecords;
        });
      
        setRectangles([]);
        clearCanvasPixels();
    };
      
  
    const handleRowClick = (record: SavedRecord) => {
      setSelectedRecordId(record.id);
      setRectangles(record.rectangles);
      redrawAll(record.rectangles);
    };
  
    const handleDeleteRecord = (id: string) => {
        setSavedRecords((prev) => {
          const updatedRecords = prev.filter((record) => record.id !== id);
          originalRecordsRef.current = updatedRecords; // Sync original records
          return updatedRecords;
        });
    };
      
    const handleSort = (criterion: string) => {
      const sortedRecords = [...savedRecords].sort((a, b) => {
        if (criterion === "distance") return a.distance - b.distance;
        if (criterion === "timestamp")
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        return 0;
      });
      setSavedRecords(sortedRecords);
    };

    const handleFilter = (filter: string) => {
      const originalRecords = originalRecordsRef.current; // Access the ref value
    
      setIsFiltered(true); // Mark that filter is applied
    
      if (filter === "all") {
        setSavedRecords([...originalRecords]); // Reset to all records
      } else if (filter === "short") {
        setSavedRecords(originalRecords.filter((record) => record.distance < 100));
      } else if (filter === "medium") {
        setSavedRecords(
          originalRecords.filter(
            (record) => record.distance >= 100 && record.distance <= 200
          )
        );
      } else if (filter === "long") {
        setSavedRecords(originalRecords.filter((record) => record.distance > 200));
      }
    };    
  
    useEffect(() => {
      if (rectangles.length <= 2 && rectangles.length > 0) {
        redrawAll(rectangles);
      }
      if (rectangles.length === 0) {
        clearCanvasPixels();
      }
    }, [rectangles, clearCanvasPixels, redrawAll]);
  
    const value: CanvaContextValue = {
      canvasRef,
      rectangles,
      savedRecords,
      selectedRecordId,
      isDrawing,
      isFiltered,
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      handleSave,
      handleClearCanvas,
      handleRowClick,
      handleDeleteRecord,
      handleSort,
      handleFilter,
      handleUndo,
      handleRedo
    };
  
    return <CanvaContext.Provider value={value}>{children}</CanvaContext.Provider>;
  };  
