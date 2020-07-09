import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { Universe, Cell } from "wasm-game-of-life";
import { memory } from "wasm-game-of-life/wasm_game_of_life_bg";

const CELL_SIZE = 8;
const GRID_COLOR = "#AAA";
const DEAD_COLOR = "#FFF";
const ALIVE_COLOR = "#444";

export const GameOfLife = () => {
  const [universe, setUniverse] = useState();
  const [width, setWidth] = useState();
  const [height, setHeight] = useState();
  const [ctx, setCtx] = useState();
  const [isPlaying, setIsPlaying] = useState(false);
  const frameId = useRef(null);

  const ref = useCallback((canvas) => {
    const universe = Universe.new(50, 50, 0.5);
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

  const handleRestartButton = useCallback(() => {
    if (!universe || !ctx) return;
    universe.restart(0.5);
    if (frameId.current === null) {
      drawGrid();
      drawCells();
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
    <div className="h-full flex justify-center items-center">
      <div className="flex flex-col flex-wrap items-center p-2 md:p-4 m-1 bg-gray-400 rounded-lg">
        <p className="text-gray-800 font-bold text-4xl">Game of Life</p>
        <canvas ref={ref} className="max-w-full mt-2" />
        <div className="mt-2">
          <button onClick={() => handlePlayButton()}>
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
