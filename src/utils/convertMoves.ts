import type { Move, Square } from 'chess.js';

export const convertMoves = (moves: Move[]) => {
	return moves.reduce((acc, { from, to }) => {
		const temp = acc.get(from);
		if (temp) {
			acc.set(from, [...temp, to]);
		} else {
			acc.set(from, [to]);
		}

		return acc;
	}, new Map<Square, Square[]>());
};
