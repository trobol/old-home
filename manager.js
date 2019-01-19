
const wd = process.cwd(),
	fs = require('fs');
let version = 'v0.0';
run('git describe --tags --abbrev=0')
	.catch((error) => {
		console.log('No Tags');
	})
	.then((v) => {
		version = v;
		a();
	});
function a() {
	if (!fs.existsSync(`${wd}/.git`)) {
		console.log('The current folder does not contain a git repository');
		process.exit();
	}

	let name = wd.slice(wd.lastIndexOf('\\') + 1);
	console.log(wd);
	console.log(name);
	if (fs.existsSync(`${__dirname}/projects/${name}/${version}`)) {
		//all commits to master will be put into latest until a new version is created
		//put the files in 'latest'
		console.log('file exists');
	} else {
		//rename latest to version
		//create new latest
		if (fs.existsSync(`${__dirname}/projects/${name}`)) {
			console.log(`${__dirname}/projects/${name} exists`);
			fs.renameSync(`${__dirname}/projects/${name}/latest`, `${__dirname}/projects/${name}/${version}`);
		} else {
			console.log(`Adding ${name} to projects`);
			fs.mkdirSync(`${__dirname}/projects/${name}`);
		}
		//fs.mkdirSync(`${__dirname}/projects/${name}/latest`);
		run(`git submodule add https://github.com/trobol/${name} ./latest`, `${__dirname}/projects/${name}`)
			.catch(e => console.log('Error', e));
		console.log('file exists');
	}
}
function run(input, cwd) {
	return new Promise((resolve, reject) => {
		let args = input.split(' '),
			command = args.shift();
		const { spawn } = require('child_process'),
			child = spawn(command, args, { cwd });
		let stdout = '',
			stderr = '';


		child.on('exit', function (code, signal) {
			if (stderr) {
				reject(stderr);
			}
			resolve(stdout);

		});
		child.stdout.on('data', (data) => {
			stdout += data;
		});

		child.stderr.on('data', (data) => {
			stderr += data;
		});
	});
}