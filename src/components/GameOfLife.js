import React, { useState, useRef, useCallback, useEffect } from "react";
import { Universe, Cell } from "wasm-game-of-life";
import { memory } from "wasm-game-of-life/wasm_game_of_life_bg";

const CELL_SIZE = 8;
const GRID_COLOR = "#AAA";
const DEAD_COLOR = "#FFF";
const ALIVE_COLOR = "#444";

export const GameOfLife = () => {
  const [universe, setUniverse] = useState();
  const [ctx, setCtx] = useState();
  const [isPlaying, setIsPlaying] = useState(false);
  const frameId = useRef(null);
  const canvasRef = useRef();
  const size = useRef({ width: 0, height: 0 });

  const ref = useCallback((canvas) => {
    const universe = Universe.new(50, 50, 0.5);
    const ctx = canvas.getContext("2d");
    const width = universe.width();
    const height = universe.height();
    canvas.height = (CELL_SIZE + 1) * height + 1;
    canvas.width = (CELL_SIZE + 1) * width + 1;
    setUniverse(universe);
    size.current.width = width;
    size.current.height = height;
    setCtx(ctx);
    canvasRef.current = canvas;
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
  }, [universe, ctx, renderLoop]);

  const handleRestartButton = useCallback(() => {
    if (!universe || !ctx) return;
    universe.restart(0.5);
    drawGrid();
    drawCells();
  }, [universe, ctx]);

  const handleCanvasClick = useCallback(
    (event) => {
      if (!universe || !ctx) return;
      const canvas = event.target;
      const boundingRect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / boundingRect.width;
      const scaleY = canvas.height / boundingRect.height;

      const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
      const canvasTop = (event.clientY - boundingRect.top) * scaleY;

      const row = Math.min(
        Math.floor(canvasTop / (CELL_SIZE + 1)),
        size.current.height - 1
      );
      const col = Math.min(
        Math.floor(canvasLeft / (CELL_SIZE + 1)),
        size.current.width - 1
      );

      universe.toogle_cell(row, col);

      drawGrid();
      drawCells();
    },
    [universe, ctx, drawGrid, drawCells]
  );

  const handleSize = useCallback(
    (delta) => {
      const wasPlaying = frameId.current !== null;
      if (wasPlaying) handlePlayButton();
      delta > 0 ? universe.increase_size() : universe.decrease_size();
      const canvas = canvasRef.current;
      const width = universe.width();
      const height = universe.height();
      canvas.height = (CELL_SIZE + 1) * height + 1;
      canvas.width = (CELL_SIZE + 1) * width + 1;
      size.current.width = width;
      size.current.height = height;
      if (wasPlaying) handlePlayButton();
      drawGrid();
      drawCells();
    },
    [universe]
  );

  const getIndex = useCallback(
    (row, col) => row * size.current.width + col,
    []
  );

  const renderLoop = useCallback(() => {
    for (let i = 0; i < 1; i++) {
      universe.tick();
    }

    drawGrid();
    drawCells();

    frameId.current = requestAnimationFrame(() => renderLoop());
  }, [universe, drawGrid, drawCells]);

  const drawGrid = useCallback(() => {
    const { width, height } = size.current;
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
  }, [ctx]);

  const drawCells = useCallback(() => {
    const { width, height } = size.current;
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
  }, [universe, ctx, getIndex]);

  return (
    <div className="h-full flex justify-center items-center">
      <div className="flex flex-col flex-wrap items-center p-2 md:p-4 m-1 bg-gray-400 rounded-lg">
        <p className="text-gray-800 font-bold text-4xl">Game of Life</p>
        <canvas
          ref={ref}
          className="max-w-full md:max-w-md lg:max-w-lg mt-2 cursor-pointer"
          onClick={handleCanvasClick}
        />
        <div className="mt-4 flex flex-wrap items-center">
          <button onClick={() => handleSize(-1)}>
            <svg
              className="h-8 w-8 fill-current"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M 0 9 h17 v3 H3 v-3 z" />
            </svg>
          </button>
          <button className="ml-2" onClick={() => handlePlayButton()}>
            <svg
              className="h-8 w-8 fill-current"
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
          <button className="ml-2" onClick={() => handleRestartButton()}>
            <svg
              className="h-8 w-8 fill-current"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M14.66 15.66A8 8 0 1 1 17 10h-2a6 6 0 1 0-1.76 4.24l1.42 1.42zM12 10h8l-4 4-4-4z" />
            </svg>
          </button>
          <button className="ml-2" onClick={() => handleSize(1)}>
            <svg
              className="h-8 w-8 p-1 fill-current"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path d="M24 10h-10v-10h-4v10h-10v4h10v10h4v-10h10z" />
            </svg>
          </button>
          {/* <div className="ml-2 flex flex-col">
            <button
              className="h-4 py-0 text-xs font-semibold"
              onClick={() => handleSize(-1)}
            >
              size -
            </button>
            <button
              className="h-4 py-0 mt-1 text-xs font-semibold"
              onClick={() => handleSize(1)}
            >
              size +
            </button>
          </div> */}
        </div>
        <p className="mt-4 break-words text-sm">
          Demo of game of life using wasm + react + tailwind{" "}
          <a
            href="http://github.com/renato145/game-of-life/"
            target="_blank"
            rel="noopener"
            className="font-semibold"
          >
            (source code)
          </a>
        </p>
        {/* <div>fps</div> */}
      </div>
    </div>
  );
};
