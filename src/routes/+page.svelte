<script lang="ts">
	import { onMount } from 'svelte';
	import { Chessground } from 'chessground';
	import { Chess, type Square } from 'chess.js';
	import { convertColorString } from '../utils/convertColorString';
	import { convertMoves } from '../utils/convertMoves';
	import '../lib/css/chessground.css';
	import '../lib/css/chessground.brown.css';
	import '../lib/css/chessground.cburnett.css';

	let chess: Chess;
	let ground: ReturnType<typeof Chessground>;
	let stockfish: Worker;
	let evaluation: string | number = 0;

	function onMove(orig: Square, dest: Square) {
		if (chess.get(orig).type === 'p' && (dest[1] === '1' || dest[1] === '8')) {
			const promotion = prompt('Promote to? (q, r, b, n)');
			if (promotion) {
				chess.move({ from: orig, to: dest, promotion });
			}
		} else {
			chess.move({ from: orig, to: dest });
		}
		const moves = chess.moves({ verbose: true });

		ground.set({
			fen: chess.fen(),
			turnColor: convertColorString(chess.turn()),
			check: chess.inCheck(),
			movable: {
				free: false,
				color: convertColorString(chess.turn()),
				dests: convertMoves(moves),
				showDests: true
			},
			highlight: {
				lastMove: true,
				check: true
			}
		});

		uciCmd('stop');
		uciCmd(
			'position startpos moves ' +
				chess
					.history({ verbose: true })
					.map(({ lan }) => lan)
					.join(' ')
		);
		// uciCmd('eval');
		uciCmd('go depth 18');
	}

	function uciCmd(cmd: string) {
		console.log('UCI: ' + cmd);

		stockfish.postMessage(cmd);
	}

	onMount(async () => {
		chess = new Chess();
		const moves = chess.moves({ verbose: true });

		ground = Chessground(document.getElementById('chessground')!, {
			fen: chess.fen(),
			movable: {
				free: false,
				color: convertColorString(chess.turn()),
				dests: convertMoves(moves),
				showDests: true,
				events: {
					after: onMove
				}
			},
			highlight: {
				lastMove: true,
				check: true
			}
		});

		stockfish = new Worker('stockfish.js');

		uciCmd('uci');
		uciCmd('setoption name Use NNUE value true');

		uciCmd('ucinewgame');
		uciCmd('isready');

		stockfish.onmessage = function (event) {
			console.log('STOCKFISH: ' + event.data);

			if (event.data.includes('depth')) {
				if (event.data.includes('cp')) {
					const depth = event.data.match(/depth\s(\d+)/)[1];
					if (depth < 10) return;

					const sign = chess.turn() === 'w' ? 1 : -1;
					evaluation = (parseInt(event.data.match(/cp\s([-+]?\d+)/)[1]) / 100) * sign;
				} else if (event.data.includes('mate')) {
					evaluation = `#${event.data.match(/mate\s([-+]?\d+)/)[1]}`;
				}
			}

			if (chess.turn() === 'b' && event.data.includes('bestmove')) {
				const move = event.data.split(' ')[1];
				const orig = move.substring(0, 2);
				const dest = move.substring(2, 4);
				const promotion = move.substring(4, 5);
				ground.move(orig, dest);
				onMove(orig, dest);
			}

			if (event.data.includes('NNUE evaluation')) {
				console.log(event.data.match(/[\+\-][\S]+/)[0]);
				evaluation = Number(event.data.match(/[\+\-][\S]+/)[0]);
			}
		};
	});
</script>

<div id="chessground" />
<span>{evaluation}</span>

<style>
	#chessground {
		margin: auto;
		width: 800px;
		height: 800px;
	}
</style>
