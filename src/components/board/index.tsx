import React, {useContext, useReducer} from "react";
import {DndProvider, useDrag, useDrop} from "react-dnd";
import {HTML5Backend} from "react-dnd-html5-backend";
import classnames from "classnames/bind";

import styles from "./board.module.scss";
const bStyles = classnames.bind(styles);

type SquareColor = "light" | "dark";
type Color = "white" | "black";
type APiece = {color: Color, type: keyof typeof Pieces};
type Location = {rank: number, file: number};
type BoardState = string[][];

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

interface Ply {
	boardState: BoardState;
	piece: APiece;
	from: Location;
	to: Location;
	alternates?: Ply[];
}

interface Move {
	from: Location;
	to: Location;
};

interface IBoardContext {
	move: (move: Move) => void;
	canDropPiece: (item: Location, rank: number, file: number) => boolean;
	board: Ply[];
}

const BoardContext = React.createContext<IBoardContext>({} as IBoardContext);

interface RowProps {
	start: SquareColor;
	pieces: string[];
	rank: number;
}

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

const baseBoard: BoardState = [
	['R', 'N', 'B', 'Q', 'C', 'K', 'A', 'B', 'N', 'R'],
	['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
	['', '', '', '', '', '', '', '', '', ''],
	['', '', '', '', '', '', '', '', '', ''],
	['', '', '', '', '', '', '', '', '', ''],
	['', '', '', '', '', '', '', '', '', ''],
	['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
	['r', 'n', 'b', 'q', 'c', 'k', 'a', 'b', 'n', 'r'],
];

const getBoardState = (board: Ply[]) => {
	const currentPly: Ply = board.length ? board[board.length - 1] : {} as Ply;
	return {
		pieces: currentPly.boardState ?? baseBoard,
		toMove: currentPly.piece?.color === "white" ? "black" : "white" as Color,
	};
};

const getPiece = (board: Ply[], {rank, file}: Location): APiece | undefined => {
	const {pieces} = getBoardState(board);
	const piece = pieces[rank][file];
	if (!piece)
		return undefined;
	const u = piece.toUpperCase() as keyof typeof Pieces;
	const color = piece === u ? "white" : "black";
	return {type: u, color};
};

const reducer = (board: Ply[], move: Move): Ply[] => {
	const {pieces, toMove} = getBoardState(board);

	const piece = getPiece(board, move.from);
	if (!piece || piece.color !== toMove)
		return board;

	const newBoardState = [...pieces.map(f => [...f])];
	newBoardState[move.from.rank][move.from.file] = '';
	newBoardState[move.to.rank][move.to.file] = piece.color === "white" ? piece.type :piece.type.toLowerCase();

	const ply: Ply = {
		boardState: newBoardState,
		piece,
		from: move.from,
		to: move.to,
	};

	return [...board, ply];
};

export const Board = () => {
	const [board, move] = useReducer(reducer, []);
	const {pieces} = getBoardState(board);
	let start: SquareColor = "dark";
	const ret: React.ReactNode[] = [];

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

	const canDropPiece = (item: Location, rank: number, file: number): boolean => {
		if (rank === item.rank && file === item.file) return false;
		const piece = getPiece(board, item);
		const destPiece = getPiece(board, {rank, file});
		if (!piece)
			return false;
		if (destPiece?.color === piece.color)
			return false;
		return canMoveHere(item, {rank, file}, piece);
	};

	for (let i = 0; i < pieces.length; i++) {
		ret.unshift(<Row start={start} pieces={pieces[i]} rank={i} />);
		start = start === "dark" ? "light" : "dark";
	}
	return (
		<DndProvider backend={HTML5Backend}>
			<BoardContext.Provider value={{move, canDropPiece, board}}>
				{ret}
			</BoardContext.Provider>
		</DndProvider>
	);
};

interface SquareProps {
	rank: number;
	file: number;
	color: SquareColor;
}

const Square = ({rank, file, color}: SquareProps) => {
	const board = useContext(BoardContext);
	const piece = getPiece(board.board, {rank, file});

	const [{canDrop, isOver}, drop] = useDrop<Location, any, any>(
		() => ({
			accept: Object.keys(Pieces),
			canDrop: item => board.canDropPiece(item, rank, file),
			drop: item => board.move({from: item, to: {rank, file}}),
			collect: (monitor) => ({
				canDrop: !!monitor.canDrop(),
				isOver: !!monitor.isOver(),
			}),
		}),
		[rank, file, board],
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
	const board = useContext(BoardContext);
	const {toMove} = getBoardState(board.board);

	const [{isDragging}, drag] = useDrag(
		() => ({
			type: piece.type,
			item: {rank, file},
			canDrag: () => piece.color === toMove,
			collect: monitor => ({
				isDragging: !!monitor.isDragging(),
			}),
		}),
		[piece, rank, file, toMove],
	);

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
