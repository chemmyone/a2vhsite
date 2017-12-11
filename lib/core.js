/*
	Module dependencies
*/
// Node.js spawn for system calls
const {spawnSync} = require("child_process");
// Node.js file system for file interaction
const fs = require("fs");
// mkdirp to mimic mkdir -p without using a system call
const mkdirp = require("mkdirp");


const system = function(command, args) {
	return [
		// Output
		spawnSync(command, args),
		// Command that ran
		command,
		args
	];
};


/*
	Config class

	Usage:
	let config = new core.Config({
		"address": "*",
		"port": "80",
		"directives": {
		"ServerAlias": "example.com"
	}
	});

	let config = new core.Config({
		"template": "./template.conf"
	});
*/
class Config {
	constructor(domain, object) {
		if (!domain) {
			throw new Error("No domain was passed into the config contructor.");
		}

		this.domain = domain;
		this.replacements = [{
			"regex": /\{domain\}/gi,
			"value": this.domain
		}];

		let text;

		if (object.template) {
			// Read template files
			text = fs.readFileSync(object.template).toString();
		} else if (object.address && object.port) {
			// Create from data (constructor)
			// Join values if set from multiple command line arguments, allow for extension of the interface
			object = this.constructor.joinValues(object);

			// Virtual Host start tag
			text = `<VirtualHost ${object.address}:${object.port}>\n`;

			// Directives
			for (const key in object.directives) {
				text += `\t${key} ${object.directives[key]}\n`;
			}

			// Virtual Host end tag
			text += "</VirtualHost>\n";
		} else {
			throw new Error("No template, address or port was passed into the config contructor.");
		}

		// Replace text values
		this.data = this.constructor.replace(text, this.replacements);
	}

	// Save config to conf file at `path`
	save(path) {
		// In case the path contains {domain}
		path = this.constructor.replace(path, this.replacements);
		// Output to file in folder
		if (!path.match(/(\/|\\)$/)) {
			// Add trailing slash if missing
			path += "/";
		}
		fs.writeFileSync(`${path}${this.domain}.conf`, this.data);
		return `${path}${this.domain}.conf`;
	}
	// Enable using `a2ensite`
	enable() {
		return system("a2ensite", [this.domain]);
	}

	// Join values in arrays in the config data object to allow for multiple ports, addresses, etc if an array was used (i.e. from flags)
	static joinValues(object) {
		for (const key in object) {
			if (Array.isArray(object[key])) {
				// Join array
				object[key] = object[key].join(" ");
			} else if (!Array.isArray(object[key]) && typeof object[key] === "object") {
				// Recursive
				object[key] = this.joinValues(object[key]);
			} else if (typeof object[key] === "string") {
				// Skip string
				continue;
			}
		}

		return object;
	}
	// Run all the regex in Object.replacements to allow for it to be extendable in the future
	static replace(text, replacements) {
		// Substitute replacements in the "table"
		for (const replacement of replacements) {
			text = text.replace(replacement.regex, replacement.value);
		}

		return text;
	}
}


// Make folders, equivalent to `mkdir -p`
const mkdir = function(folder) {
	let stats;
	try {
		stats = fs.statSync(folder);
	} catch (error) {
		stats = false;
	}

	if (stats && stats.isDirectory()) {
		return false;
	} else if (stats && stats.isFile()) {
		throw new Error(`${folder} is an existing file.`);
	}

	mkdirp.sync(folder);

	return true;
};

// Reload using `service apache2 reload`
const reload = function() {
	return system("service", ["apache2", "reload"]);
};


const data = {
	Config,
	reload,
	mkdir
};

module.exports = data;
