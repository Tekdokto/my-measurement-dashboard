export interface RectangleData {
    x: number;
    y: number;
    width: number;
    height: number;
  }
  
  export interface SavedRecord {
    id: string;
    rectangles: RectangleData[];
    distance: number;
    createdAt: string;
  }
  