const fetch = require('node-fetch'),
	config = require('./config'),
	fs = require('fs'),
	https = require('https'),
	prompts = require('prompts');

(async () => {
	let data;
	// Get all repos from user
	try {
		data = await fetch(`https://api.github.com/users/${config.username}/repos`).then(res => res.json());
		console.log(`User: ${config.username} has ${data.length} repositories:`);
		console.log(data.map(item => `${data.indexOf(item)}.) ${item.name}`).join('\n'));
	} catch (e) {
		console.log(e);
	}
	if (!data) return;

	// Find what repo to download
	const response = await prompts({
		type: 'number',
		name: 'value',
		message: 'What file to download',
		validate: value => (value > data.length || value < 0) ? 'Invalid number' : true,
	});

	console.log(response);
	const dest = `./${data[response.value].name}.zip`;
	const url = `https://codeload.github.com/${data[response.value].full_name}/zip/master`;
	download(url, dest, function() {
		console.log('Done');
	});
})();

// Download repo's file
function download(url, dest, cb) {
	const file = fs.createWriteStream(dest);
	https.get(url, function(response) {
		response.pipe(file);
		file.on('finish', function() {
			file.close(cb);
		});
	}).on('error', function(err) {
		fs.unlink(dest);
		if (cb) cb(err.message);
	});
}
