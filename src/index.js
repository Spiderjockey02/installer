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
	const { value } = await prompts({
		type: 'number',
		name: 'value',
		message: 'What file to download',
		validate: input => (input < data.length && input >= 0) ? true : 'Invalid number',
	});
	if (!value && value != 0) return;

	// Find what repo to download
	let branch;
	try {
		branch = await fetch(`https://api.github.com/repos/${data[value].full_name}/branches`)
			.then(res => res.json())
			.then(resp => resp.map(item => item.name));
	} catch (e) {
		console.log(e);
		branch = data[value].default_branch;
	}

	const { value: branchToDownload } = await prompts({
		type: 'text',
		name: 'value',
		message: 'Download default branch (y) if not specify branch name',
		validate: input => (input == 'y' || branch.includes(input)) ? true : 'Invalid branch',
	});
	if (!branchToDownload) return;
	branch = branchToDownload == 'y' ? data[value].default_branch : branchToDownload;

	// Download repo as ZIP
	const dest = `./${data[value].name}.zip`;
	const url = `https://codeload.github.com/${data[value].full_name}/zip/${branch}`;
	download(url, dest, function() {
		console.log('Done');
	});

	// Once file is downloaded find and start editing config file
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
