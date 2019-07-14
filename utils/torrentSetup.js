const WebTorrent = require('webtorrent');
const path = require('path');
const router = require('express').Router();
const magnetURI = require('magnet-uri');
const fs = require('fs');
const MatroskaSubtitles = require('matroska-subtitles');
const parseRange = require('range-parser');

const exec = require('child_process').exec;

const client = new WebTorrent();

// global variable to hold magnet info
let magnet;

let stats = {
	progress: 0,
	downloadSpeed: 0,
	ratio: 0
};

client.on('error', err => {
	console.log(err.message);
});

client.on('download', bytes => {
	stats = {
		progress: client.progress,
		downloadSpeed: client.downloadSpeed,
		ratio: client.ratio
	};
});

let previousTorrent = {};

// Adding the magnet file to the download
router.get('/add/*', async (req, res, next) => {
	magnet = magnetURI.encode(req.query);

	// cleaning  up torrent downloads
	// for (let tor in previousTorrent) {
	// 	client.remove(previousTorrent[tor], data =>
	// 		console.log(`deteleted torrent ${data}`)
	// 	);
	// 	delete tor;
	// }

	try {
		//await clearTmp();
	} catch (err) {
		console.log(err);
		//throw err;
	}
	client.add(magnet, { path: path.join(__dirname + '/tmp') }, torrent => {
		let files = [];

		torrent.files.forEach(data => {
			files.push({
				name: data.name,
				length: data.length
			});
		});
		previousTorrent.torID = magnet;
		res.status(200);
		res.json(files);
	});
});

router.get('/stream/:file_name', (req, res, next) => {
	const tor = client.get(magnet);
	const filePath = path.join(__dirname, 'tmp', tor.files[0].path);
	const size = tor.files[0].length;

	// Support range-requests
	res.setHeader('Content-Type', 'video/webm');
	res.setHeader('Accept-Ranges', 'bytes');

	// Support DLNA streaming
	res.setHeader('transferMode.dlna.org', 'Streaming');
	res.setHeader(
		'contentFeatures.dlna.org',
		'DLNA.ORG_OP=01;DLNA.ORG_CI=0;DLNA.ORG_FLAGS=01700000000000000000000000000000'
	);

	let range = parseRange(size, req.headers.range || '');
	if (Array.isArray(range)) {
		range = range[0];

		res.statusCode = 206;

		res.setHeader('Content-Length', range.end - range.start + 1);
		res.setHeader(
			'Content-Range',
			`bytes ${range.start}-${range.end}/${size}`
		);
		res.setHeader('Keep-Alive', '6000');
	} else {
		// Here range is either -1 or -2
		res.setHeader('Content-Length', size);
		range = null;
	}

	const stream = tor.files[0].createReadStream(range);

	const close = () => {
		// when fast-forwarding
		if (stream) {
			stream.destroy();
		}
	};

	res.once('close', close);
	res.once('error', close);
	res.once('finish', close);

	stream.pipe(res);

	try {
		//parseSubs(filePath, range.start);
	} catch (err) {
		console.log(`subs error ${err}`);
	}
});

router.get('/stats', (req, res, next) => {
	res.status(200);
	res.json(stats);
});

const parseSubs = (filePath, start) => {
	var parser = new MatroskaSubtitles();
	parser.once('tracks', tracks => {
		console.log(tracks);
	});

	parser.on('subtitle', (sub, tracnNum) => {
		console.log(sub);
	});

	let subStream = fs.createReadStream(filePath, {
		fd: filePath,
		start: start
	});

	subStream.pipe(parser);
};

/* Helper method to clear the temp directory */
const clearTmp = () => {
	return new Promise((resolve, error) => {
		fs.readdir(path.join(__dirname, 'tmp'), (err, data) => {
			if (data.length == 0) return;
			if (err) {
				console.log(`Couldn't read directory ${err}`);
				error('Error opening temp folder');
			}
			console.log(data);
			for (let i = 0; i < data.length; i++) {
				fs.unlink(path.join(__dirname, 'tmp', data[i]), err => {
					if (err) {
						error('Error clearing temp folder');
					}
					resolve('tmp was cleared');
				});
			}
		});
	});
};

module.exports = router;
