import React from "react";
import {DndProvider, useDrag, useDrop} from "react-dnd";
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

const Pieces = {
	A: "Archbishop",
	B: "Bishop",
	C: "Chancellor",
	K: "King",
	N: "Knight",
	P: "Pawn",
	Q: "Queen",
	R: "Rook",
};

const Row = ({start, pieces, rank}: RowProps) => {
	const ret: React.ReactNode[] = [];
	for (let i = 0; i < pieces.length; i++) {
		ret.push(
			<Square
				rank={rank}
				file={i}
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
		ret.unshift(<Row start={start} pieces={board[i]} rank={i} />);
		start = start === "dark" ? "light" : "dark";
	}
	return <DndProvider backend={HTML5Backend}>{ret}</DndProvider>;
};

interface SquareProps {
	rank: number;
	file: number;
	color: SquareColor;
	piece?: string;
}

const Square = ({rank, file, color, piece}: SquareProps) => {
	let pieceR: React.ReactNode = null;
	if (piece) {
		const u = piece.toUpperCase() as keyof typeof Pieces;
		const color = piece === u ? "white" : "black";

		if (u)
			pieceR = <Piece color={color} type={u} />;
	}

	const [{isOver}, drop] = useDrop(
		() => ({
			accept: Object.keys(Pieces),
			drop: () => console.log(rank, file),
			collect: (monitor) => ({
				isOver: !!monitor.isOver(),
			}),
		}),
		[rank, file],
	);

	return (
		<div ref={drop} className={bStyles("square", color, {isOver})}>
			{pieceR}
		</div>
	);
};

interface PieceProps {
	type: keyof typeof Pieces;
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
