import React, { useState, useEffect, useRef } from "react";
import { useCanva, CanvaProvider } from "./context/CanvasContext";
import "./App.css";

const AppContent: React.FC = () => {
  const {
    canvasRef,
    rectangles,
    savedRecords,
    selectedRecordId,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleSave,
    isFiltered,
    handleClearCanvas,
    handleRowClick,
    handleDeleteRecord,
    handleSort,
    handleFilter
  } = useCanva();

  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    if (rectangles.length > 0) {
      setShowHint(false);
    }
  }, [rectangles]);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const bubbleColors = [
    "#08f7fe",
    "#f81ce5",
    "#fff720",
    "#ff2e63",
    "#00fe3d",
    "#ff9f1c",
    "#2ec4b6",
  ];

  // Set up the canvas size to match its logical and physical pixel dimensions
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;

    if (canvas && wrapper) {
      const ctx = canvas.getContext("2d");

      // Match canvas logical size with wrapper's size (CSS pixels)
      const { width, height } = wrapper.getBoundingClientRect();
      canvas.width = Math.floor(width);
      canvas.height = Math.floor(height);

      // Set canvas background color
      if (ctx) {
        ctx.fillStyle = "#1F1F1F";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [canvasRef, wrapperRef]);

  const handleMouseMoveWithBubbles = (e: React.MouseEvent) => {
    handleMouseMove(e);

    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const bubble = document.createElement("div");
    bubble.classList.add("bubble", "bubble-default");
    bubble.style.backgroundColor =
      bubbleColors[Math.floor(Math.random() * bubbleColors.length)];
    bubble.style.left = `${x}px`;
    bubble.style.top = `${y}px`;

    wrapperRef.current.appendChild(bubble);

    setTimeout(() => {
      if (bubble && wrapperRef.current?.contains(bubble)) {
        wrapperRef.current.removeChild(bubble);
      }
    }, 1500);
  };

  const getDimensionText = (width: number, height: number) =>
    `${Math.abs(width)} x ${Math.abs(height)}`;

  return (
    <div className="app-container">
      <h1 className="app-title">Measurement Drawing Dashboard</h1>

      <div className="canvas-and-shortcuts">
        <div className="canvas-wrapper" ref={wrapperRef}>
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMoveWithBubbles}
          />
          {showHint && (
            <div className="canvas-hint">
              Click &amp; Drag to Draw!
            </div>
          )}
        </div>

        <div className="shortcuts-container">
          <h3 className="shortcuts-title">Shortcuts</h3>
          
          {/* Shortcut Items Group */}
          <div className="shortcut-items">
            <div className="shortcut-item">
              <span>Ctrl + C</span>
              <span>Clear</span>
            </div>
            <div className="shortcut-item">
              <span>Ctrl + Z</span>
              <span>Undo</span>
            </div>
            <div className="shortcut-item">
              <span>Ctrl + Shift + Z</span>
              <span>Redo</span>
            </div>
          </div>

          {/* Buttons Group */}
          <div className="buttons-container">
            <button onClick={handleSave}>Save</button>
            <button onClick={handleClearCanvas}>Clear Canvas</button>
          </div>
        </div>
      </div>

      {rectangles.length === 2 && (
        <div className="rect-info">
          <p>
            <strong>Rect #1:</strong>{" "}
            {getDimensionText(rectangles[0].width, rectangles[0].height)}
          </p>
          <p>
            <strong>Rect #2:</strong>{" "}
            {getDimensionText(rectangles[1].width, rectangles[1].height)}
          </p>
        </div>
      )}

      <h2>Saved Measurements</h2>
      <div className="controls">
        <div className="sorting-controls">
          <label htmlFor="sort-distance">
            Sort By:
          </label>
          <select onChange={(e) => handleSort(e.target.value)}>
            <option value="timestamp">Timestamp</option>
            <option value="distance">Distance</option>
          </select>
        </div>
        <div className="filter-controls">
          <label htmlFor="filter-distance">
            Filter By Distance:
          </label>
          <select onChange={(e) => handleFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="short">Short ({'<'} 100px)</option>
            <option value="medium">Medium (100-200px)</option>
            <option value="long">Long ({'>'} 200px)</option>
          </select>
        </div>
      </div>
      {/* Table Rendering */}
      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Rect #1 (W x H)</th>
              <th>Rect #2 (W x H)</th>
              <th>Distance</th>
              <th>Created At</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {savedRecords.length === 0 && !isFiltered ? (
              // When there are no records at all (i.e., no drawing or no saved data)
              <tr>
                <td colSpan={5} className="empty-table-row">
                  No records found.
                </td>
              </tr>
            ) : savedRecords.length === 0 && isFiltered ? (
              // When no records match the current filter
              <tr>
                <td colSpan={5} className="empty-table-row">
                  No records match the selected filter.
                </td>
              </tr>
            ) : (
              savedRecords.map((record) => {
                const [r1, r2] = record.rectangles;
                const isSelected = record.id === selectedRecordId;
                return (
                  <tr
                    key={record.id}
                    className={isSelected ? "selected-row" : ""}
                    onClick={() => handleRowClick(record)}
                  >
                    <td>{`${Math.abs(r1.width)} x ${Math.abs(r1.height)}`}</td>
                    <td>{`${Math.abs(r2.width)} x ${Math.abs(r2.height)}`}</td>
                    <td>{record.distance}</td>
                    <td>{new Date(record.createdAt).toLocaleString()}</td>
                    <td>
                      <button
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent row click
                          handleDeleteRecord(record.id);
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <CanvaProvider>
      <AppContent />
    </CanvaProvider>
  );
};

export default App;
