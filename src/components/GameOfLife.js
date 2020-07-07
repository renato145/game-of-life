import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Universe, Cell } from "wasm-game-of-life";
import { memory } from "wasm-game-of-life/wasm_game_of_life_bg";

const CELL_SIZE = 8;
const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#666666";

export const GameOfLife = () => {
  const [universe, setUniverse] = useState();
  const [width, setWidth] = useState();
  const [height, setHeight] = useState();
  const [ctx, setCtx] = useState();
  const [isPlaying, setIsPlaying] = useState(false);
  const frameId = useRef(null);

  const ref = useCallback((canvas) => {
    const universe = Universe.new(64, 64, 0.5);
    const ctx = canvas.getContext("2d");
    const width = universe.width();
    const height = universe.height();
    canvas.height = (CELL_SIZE + 1) * height + 1;
    canvas.width = (CELL_SIZE + 1) * width + 1;
    setUniverse(universe);
    setWidth(width);
    setHeight(height);
    setCtx(ctx);
  }, []);

  useEffect(() => {
    if (!ctx) return;
    drawGrid();
    drawCells();
  }, [ctx]);

  const handlePlayButton = useCallback(() => {
    if (!universe || !ctx) return;
    if (frameId.current === null) {
      setIsPlaying(true);
      renderLoop();
    } else {
      setIsPlaying(false);
      cancelAnimationFrame(frameId.current);
      frameId.current = null;
    }
  }, [universe, ctx]);

  const getIndex = useCallback((row, col) => row * width + col, [width]);

  const renderLoop = useCallback(() => {
    for (let i = 0; i < 1; i++) {
      universe.tick();
    }

    drawGrid();
    drawCells();

    frameId.current = requestAnimationFrame(() => renderLoop());
  }, [universe]);

  const drawGrid = useCallback(() => {
    ctx.beginPath();
    ctx.strokeStyle = GRID_COLOR;

    // Vertical lines.
    for (let i = 0; i <= width; i++) {
      ctx.moveTo(i * (CELL_SIZE + 1) + 1, 0);
      ctx.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * height + 1);
    }

    // Horizontal lines.
    for (let j = 0; j <= height; j++) {
      ctx.moveTo(0, j * (CELL_SIZE + 1) + 1);
      ctx.lineTo((CELL_SIZE + 1) * width + 1, j * (CELL_SIZE + 1) + 1);
    }

    ctx.stroke();
  }, [ctx, width, height]);

  const drawCells = useCallback(() => {
    const cellsPtr = universe.cells();
    const cells = new Uint8Array(memory.buffer, cellsPtr, width * height);

    ctx.beginPath();

    // Alive cells.
    ctx.fillStyle = ALIVE_COLOR;
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const idx = getIndex(row, col);
        if (cells[idx] !== Cell.Alive) {
          continue;
        }

        ctx.fillRect(
          col * (CELL_SIZE + 1) + 1,
          row * (CELL_SIZE + 1) + 1,
          CELL_SIZE,
          CELL_SIZE
        );
      }
    }

    // Dead cells.
    ctx.fillStyle = DEAD_COLOR;
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const idx = getIndex(row, col);
        if (cells[idx] !== Cell.Dead) {
          continue;
        }

        ctx.fillRect(
          col * (CELL_SIZE + 1) + 1,
          row * (CELL_SIZE + 1) + 1,
          CELL_SIZE,
          CELL_SIZE
        );
      }
    }

    ctx.stroke();
  }, [universe, ctx, width, height, getIndex]);

  return (
    <div className="">
      <canvas ref={ref} />
      <button
        className="mt-2 px-1 py-1 bg-gray-700 hover:bg-gray-500 active:bg-gray-500 focus:shadow-none text-gray-100 hover:text-gray-900"
        onClick={() => handlePlayButton()}
      >
        <svg
          className="h-5 w-5 fill-current"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          {isPlaying ? (
            <path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z" />
          ) : (
            <path d="M4 4l12 6-12 6z" />
          )}
        </svg>
      </button>
      {/* <div id="fps"></div> */}
    </div>
  );
};
