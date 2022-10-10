import React, {useContext, useState} from "react";
import {DndProvider, useDrag, useDrop} from "react-dnd";
import {HTML5Backend} from "react-dnd-html5-backend";
import classnames from "classnames/bind";

import styles from "./board.module.scss";
const bStyles = classnames.bind(styles);

type APiece = {color: "white" | "black", type: keyof typeof Pieces};
type Location = {rank: number, file: number};

interface IBoardContext {
	dropPiece: (item: Location, rank: number, file: number) => void;
	canDropPiece: (item: Location, rank: number, file: number) => boolean;
	getPiece: (item: Location) => APiece | undefined;
	pieces: string[][];
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

	const canMoveHere = (src: Location, dest: Location, piece: APiece): boolean => {
		const dRank = dest.rank - src.rank;
		const dFile = dest.file - src.file;
		const moveBishop = dRank === dFile || dRank === -dFile;
		const moveRook = dRank === 0 || dFile === 0;
		const moveKnight = (Math.abs(dRank) === 2 && Math.abs(dFile) === 1) || (Math.abs(dRank) === 1 && Math.abs(dFile) === 2);
		const moveKing = Math.abs(dRank) <= 1 && Math.abs(dFile) <= 1;
		if (piece.type === "B")
			return moveBishop;
		if (piece.type === "R")
			return moveRook;
		if (piece.type === "N")
			return moveKnight;
		if (piece.type === "K")
			return moveKing;
		if (piece.type === "Q")
			return moveRook || moveBishop;
		if (piece.type === "A")
			return moveBishop || moveKnight;
		if (piece.type === "C")
			return moveRook || moveKnight;
		if (piece.type === "P") {
			if (piece.color === "black") {
				if (src.rank === 6) return dFile === 0 && (dest.rank === 5 || dest.rank === 4);
				return dFile === 0 && dRank === -1;
			} else {
				if (src.rank === 1) return dFile === 0 && (dest.rank === 2 || dest.rank === 3);
				return dFile === 0 && dRank === 1;
			}
		}
		return false;
	};

	const dropPiece = (item: Location, rank: number, file: number) => setPieces(curr => {
		const ret = [...curr];
		const piece = getPiece(item);
		if (!piece)
			return curr;

		ret[item.rank][item.file] = '';
		ret[rank][file] = piece.color === "white" ? piece.type :piece.type.toLowerCase();
		return ret;
	});
	const canDropPiece = (item: Location, rank: number, file: number): boolean => {
		if (rank === item.rank && file === item.file) return false;
		const piece = getPiece(item);
		const destPiece = getPiece({rank, file});
		if (!piece)
			return false;
		if (destPiece?.color === piece.color)
			return false;
		return canMoveHere(item, {rank, file}, piece);
	};
	const getPiece = ({rank, file}: Location): APiece | undefined => {
		const piece = pieces[rank][file];
		if (!piece)
			return undefined;
		const u = piece.toUpperCase() as keyof typeof Pieces;
		const color = piece === u ? "white" : "black";
		return {type: u, color};
	};

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
}

const Square = ({rank, file, color}: SquareProps) => {
	const board = useContext(BoardContext);
	const piece = board.getPiece({rank, file});

	const [{canDrop, isOver}, drop] = useDrop<Location, any, any>(
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
			{piece && <Piece rank={rank} file={file} piece={piece} />}
		</div>
	);
};

interface PieceProps {
	piece: APiece;
	rank: number;
	file: number;
};

const Piece = ({piece, rank, file}: PieceProps) => {
	const [{isDragging}, drag] = useDrag(() => ({
		type: piece.type,
		item: {rank, file},
		collect: monitor => ({
			isDragging: !!monitor.isDragging(),
		}),
	}));

	return (
		<div
			ref={drag}
			className={bStyles("piece", piece.color)}
			style={{opacity: isDragging ? 0.5 : 1}}
		>
			{piece.type}
		</div>
	);
};

export default Board;
