
const wd = process.cwd(),
	path = require('path'),
	fs = require('fs');

let args = process.args;


updateSubmodules();
//Add or Update folder in projects
function a() {
	let version = 'latest';
	run('git describe --tags --abbrev=0')
		.catch((error) => {
			console.log('No Tags');
		})
		.then((v) => {
			version = v;
			if (!fs.existsSync(`${wd}/.git`)) {
				console.log('The current folder does not contain a git repository');
				process.exit();
			}

			let name = wd.slice(wd.lastIndexOf('\\') + 1);
			console.log(wd);
			console.log(name);
			//all commits to master will be put into latest
			//when a new version is created, the files will be put in there
			if (fs.existsSync(`${__dirname}/projects/${name}/${version}`)) {
				//update
				updateSubmodules();
			} else {
				if (fs.existsSync(`${__dirname}/projects/${name}`)) {
					//copy files to folder by version name
					updateSubmodules().then(r => {
						copyFolderRecursiveSync(`${__dirname}/projects/${name}/latest`, `${__dirname}/projects/${name}/${version}`, `${__dirname}/projects/${name}/${version}`);
					});
				} else {
					//add project
					console.log(`Adding ${name} to projects`);
					run(`git submodule add https://github.com/trobol/${name} projects/${name}/latest`, `${__dirname}`)
						.catch(e => console.log('Error', e));
				}


				console.log('file exists');
			}
		});
}
//update submodules then return an object with the name of the repo and the branch hash
function updateSubmodules() {
	return new Promise((resolve, reject) => {
		run('git submodule update -f', __dirname)
			.then(r => {
				r = r.split('\n');
				r.pop();
				let o = {};
				for (let e of r) {
					let nameR = /(?<=projects\/)([A-Za-z0-9]+)(?=\/)/,
						hashR = /(?<=out ')([A-Za-z0-9]+)(?=')/,
						name = e.match(nameR)[0],
						hash = e.match(hashR)[0];
					if (name && hash)
						o[name] = hash;
				}
				console.log(o);
			});
	})
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


function copyFileSync(source, target) {

	var targetFile = target;

	//if target is a directory a new file with the same name will be created
	if (fs.existsSync(target)) {
		if (fs.lstatSync(target).isDirectory()) {
			targetFile = path.join(target, path.basename(source));
		}
	}

	fs.writeFileSync(targetFile, fs.readFileSync(source));
}
function copyFolderRecursiveSync(source, target, targetFolder) {
	var files = [];

	//check if folder needs to be created or integrated
	targetFolder = targetFolder || path.join(target, path.basename(source));
	if (!fs.existsSync(targetFolder)) {
		fs.mkdirSync(targetFolder);
	}

	//copy
	if (fs.lstatSync(source).isDirectory()) {
		files = fs.readdirSync(source);
		files.forEach(function (file) {
			var curSource = path.join(source, file);
			if (fs.lstatSync(curSource).isDirectory()) {
				if (curSource.slice(curSource.lastIndexOf('\\') + 1) === '.git') {
					return;
				}

				copyFolderRecursiveSync(curSource, targetFolder);
			} else {
				copyFileSync(curSource, targetFolder);
				if (curSource.slice(curSource.lastIndexOf('\\') + 1) === '.git') {
					return;
				}
			}
		});
	}
}