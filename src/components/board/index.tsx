import React, {useContext, useState} from "react";
import {DndProvider, useDrag, useDrop} from "react-dnd";
import {HTML5Backend} from "react-dnd-html5-backend";
import classnames from "classnames/bind";

import styles from "./board.module.scss";
const bStyles = classnames.bind(styles);

type APiece = any;

interface IBoardContext {
	dropPiece: (item: APiece, rank: number, file: number) => void;
	canDropPiece: (item: APiece, rank: number, file: number) => boolean;
	getPiece: (rank: number, file: number) => APiece | undefined;
	pieces: APiece[][];
};

const BoardContext = React.createContext<IBoardContext>({} as IBoardContext);

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

export const Board = () => {
	let start: SquareColor = "dark";
	const ret: React.ReactNode[] = [];
	const [pieces, setPieces] = useState([
		['R', 'N', 'B', 'Q', 'C', 'K', 'A', 'B', 'N', 'R'],
		['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
		['', '', '', '', '', '', '', '', '', ''],
		['', '', '', '', '', '', '', '', '', ''],
		['', '', '', '', '', '', '', '', '', ''],
		['', '', '', '', '', '', '', '', '', ''],
		['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
		['r', 'n', 'b', 'q', 'c', 'k', 'a', 'b', 'n', 'r'],
	]);

	const dropPiece = (item: any, rank: number, file: number) => console.log(item, rank, file);
	const canDropPiece = (item: any, rank: number, file: number) => true;
	const getPiece = (rank: number, file: number) => pieces[rank][file];

	for (let i = 0; i < pieces.length; i++) {
		ret.unshift(<Row start={start} pieces={pieces[i]} rank={i} />);
		start = start === "dark" ? "light" : "dark";
	}
	return (
		<BoardContext.Provider value={{dropPiece, canDropPiece, getPiece, pieces}}>
			<DndProvider backend={HTML5Backend}>
				{ret}
			</DndProvider>
		</BoardContext.Provider>
	);
};

interface SquareProps {
	rank: number;
	file: number;
	color: SquareColor;
	piece?: string;
}

const Square = ({rank, file, color, piece}: SquareProps) => {
	const board = useContext(BoardContext);
	let pieceR: React.ReactNode = null;

	if (piece) {
		const u = piece.toUpperCase() as keyof typeof Pieces;
		const color = piece === u ? "white" : "black";

		if (u)
			pieceR = <Piece rank={rank} file={file} color={color} type={u} />;
	}

	const [{canDrop, isOver}, drop] = useDrop(
		() => ({
			accept: Object.keys(Pieces),
			canDrop: item => board.canDropPiece(item, rank, file),
			drop: item => board.dropPiece(item, rank, file),
			collect: (monitor) => ({
				canDrop: !!monitor.canDrop(),
				isOver: !!monitor.isOver(),
			}),
		}),
		[rank, file],
	);

	return (
		<div ref={drop} className={bStyles("square", color, {isOver, canDrop})}>
			{pieceR}
		</div>
	);
};

interface PieceProps {
	type: keyof typeof Pieces;
	color: "white" | "black";
	rank: number;
	file: number;
};

const Piece = ({type, color, rank, file}: PieceProps) => {
	const [{isDragging}, drag] = useDrag(() => ({
		type,
		item: {rank, file},
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
