import React from "react";
import {DndProvider, useDrag} from "react-dnd";
import {HTML5Backend} from "react-dnd-html5-backend";
import classnames from "classnames/bind";

import styles from "./board.module.scss";
const bStyles = classnames.bind(styles);

type SquareColor = "light" | "dark";
interface RowProps {
	start: SquareColor;
	pieces: string[];
	rank: number;
}

export enum Pieces {
	N = "Knight",
	A = "Archbishop",
	K = "King",
	C = "Chancellor",
	R = "Rook",
	P = "Pawn",
	B = "Bishop",
	Q = "Queen",
};

const Row = ({start, pieces, rank}: RowProps) => {
	const ret: React.ReactNode[] = [];
	for (let i = 0; i < pieces.length; i++) {
		ret.push(
			<Square
				name={`${rank}${String.fromCharCode(97 + i)}`}
				color={start}
				piece={pieces[i]}
			/>
		);
		start = start === "light" ? "dark" : "light";
	}
	return <div className={styles.row}>{ret}</div>;
};

const board = [
	['R', 'N', 'B', 'Q', 'C', 'K', 'A', 'B', 'N', 'R'],
	['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
	['', '', '', '', '', '', '', '', '', ''],
	['', '', '', '', '', '', '', '', '', ''],
	['', '', '', '', '', '', '', '', '', ''],
	['', '', '', '', '', '', '', '', '', ''],
	['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
	['r', 'n', 'b', 'q', 'c', 'k', 'a', 'b', 'n', 'r'],
];

export const Board = () => {
	let start: SquareColor = "dark";
	const ret: React.ReactNode[] = [];
	for (let i = 0; i < board.length; i++) {
		ret.unshift(<Row start={start} pieces={board[i]} rank={i + 1} />);
		start = start === "dark" ? "light" : "dark";
	}
	return <DndProvider backend={HTML5Backend}>{ret}</DndProvider>;
};

interface SquareProps {
	name: string;
	color: SquareColor;
	piece?: string;
}

const Square = ({name, color, piece}: SquareProps) => {
	let pieceR: React.ReactNode = null;
	if (piece) {
		const u = piece.toUpperCase();
		const color = piece === u ? "white" : "black";
		const type =
			u === "A" ? Pieces.A :
			u === "B" ? Pieces.B :
			u === "C" ? Pieces.C :
			u === "K" ? Pieces.K :
			u === "N" ? Pieces.N :
			u === "P" ? Pieces.P :
			u === "Q" ? Pieces.Q :
			u === "R" ? Pieces.R :
			undefined;
		
		if (type)
			pieceR = <Piece color={color} type={type} />;
	}
	return (
		<div className={bStyles("square", color)}>
			{pieceR}			
		</div>
	);
};

interface PieceProps {
	type: Pieces;
	color: "white" | "black";
};

const Piece = ({type, color}: PieceProps) => {
	const [{isDragging}, drag] = useDrag(() => ({
		type,
		item: {piece: type, color},
		collect: monitor => ({
			isDragging: !!monitor.isDragging(),
		}),
	}));

	return (
    <div
      ref={drag}
			className={bStyles("piece", color)}
      style={{opacity: isDragging ? 0.5 : 1}}
    >
      {type}
    </div>
  );
};

export default Board;
