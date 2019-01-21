/*
TODO:
	Add support for new tags made outside system:
		check againts tags in system
		get repo at tag
			git checkout tags/<tag_name>
		add to folder by tag
		update 'latest' to newest
*/
const wd = process.cwd(),
	path = require('path'),
	fs = require('fs'),
	name = wd.slice(wd.lastIndexOf('\\') + 1);
if (wd == __dirname)
	return;
let args = process.argv,
	operations = {
		update,
		add
	}
if (args[2]) {
	if (fs.existsSync(`${wd}/.git`)) {
		if (operations[args[2]]) {
			operations[args[2]]();
		} else {
			console.log(operations);
			console.log('Not an operation');
		}
	} else {
		console.log('Not a project folder');
	}
} else {
	console.log('No operation given');
}
function add() {
	//check if the project already exits
	if (!fs.existsSync(`${__dirname}/projects/${name}`)) {
		run(`git submodule add -f -b master https://github.com/trobol/${name} projects/${name}/latest`, __dirname)
			.catch(e => console.log('Error', e))
			.then(() => {
				run(['git', 'commit', `--message=Added ${name} to site`], __dirname)
					.then(() => run(`git push`, __dirname).catch(e => console.log(e)))
					.catch(e => console.log(e));
			})
	} else {
		console.log(`Project: ${name} already exits`)
	}

}
//Update folder in projects
function update() {
	if (!fs.existsSync(`${__dirname}/projects/${name}`)) {
		console.log(`'${name}' must be added first`);
		return;
	}
	let version = 'latest';
	console.log(`Working in ${name}`);
	run('git describe --tags --abbrev=0', `${__dirname}/projects/${name}/latest`)
		.catch((error) => {
			console.log('No Tags');
		})
		.then((v) => {

			if (v)
				version = v.slice(0, v.length - 1);
			if (!fs.existsSync(`${wd}/.git`)) {
				console.log('The current folder does not contain a git repository');
				process.exit();
			}

			//all commits to master will be put into latest
			//when a new version is created, the files will be put in there
			if (fs.existsSync(`${__dirname}/projects/${name}/${version}`)) {
				//update
				if (updateLatest())
					console.log(`Version ${version} Already Exits: Updating latest`)

			} else {
				//copy files to folder by version name
				updateLatest(name).then(r => {
					copyFolderRecursiveSync(`${__dirname}/projects/${name}/latest`, `${__dirname}/projects/${name}/${version}`, `${__dirname}/projects/${name}/${version}`);
				}).catch(e => {
					console.log(e);
				}).then(() => {
					run(['git', 'commit', `--message=Updated ${name}`], __dirname)
						.then(() => run(`git push`, __dirname).catch(e => console.log(e)))
						.catch(e => console.log(e))
				});
			}
		});
}
function updateLatest(path) {
	return run(`git submodule update -f projects/${path}/latest`, __dirname);
}
//update submodules then return an object with the name of the repo and the branch hash
function updateAllLatest() {
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
				resolve(o);
			}, reject);
	});
}
function run(args, cwd) {
	return new Promise((resolve, reject) => {
		if (typeof args == 'string')
			args = args.split(' ');
		let command = args.shift();
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
		console.log('made folder ' + targetFolder);
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