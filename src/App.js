import React from "react";
import { GameOfLife } from "./components/GameOfLife";
import './index.css';

export const App = () => {
  return (
    <div className="w-full h-screen bg-gray-900">
      <GameOfLife />
    </div>
  );
};
