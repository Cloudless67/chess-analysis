import { handler } from './build/handler.js';
import express from 'express';

const app = express();

// add a route that lives separately from the SvelteKit app
// Set response header 'Access-Control-Allow-Origin : *'
app.get('/stockfish.js', (req, res, next) => {
	res.set('Cross-Origin-Embedder-Policy', 'require-corp');
	next();
});

// let SvelteKit handle everything else, including serving prerendered pages and static assets
app.use(handler);

app.listen(8080, () => {
	console.log('Node app is running on port 8080');
});
