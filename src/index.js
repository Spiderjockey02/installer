const fetch = require('node-fetch'),
	config = require('./config'),
	fs = require('fs'),
	https = require('https'),
	prompts = require('prompts');

(async () => {
	let data;
	// Get all repos from user
	try {
		data = await fetch(`https://api.github.com/users/${config.username}/repos`)
			.then(res => res.json())
			// Sort it so star count high to low
			.then(resp => resp.sort((a, b) => b.stargazers_count - a.stargazers_count));
		console.log(`User: ${config.username} has ${data.length} repositories:`);
		console.log(data.map(item => `${data.indexOf(item)}.) ${item.stargazers_count} ${item.name}`).join('\n'));
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
	if (!response.value) return;

	// Download repo as ZIP
	const dest = `./${data[response.value].name}.zip`;
	const url = `https://codeload.github.com/${data[response.value].full_name}/zip/${data[response.value].default_branch}`;
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
