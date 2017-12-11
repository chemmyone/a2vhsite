#!/usr/bin/env node


/*
	Module dependencies
*/
// Vorpal - CLI package, also includes inquiry.js and wraps around it
const vorpal = require("vorpal")();
// Chalk for log colors!
const chalk = require("chalk");
// Core, hand made for this CLI
const core = require("../lib/core.js");
// createArguments / data
const createArguments = require("../lib/data.js");


/*
	Global Variables
*/
// The instance of the create function for prompting to
let commandInstance;
// The results of the domain, mode, and argument options setting => options
let options = {};


/*
	Utility functions
*/
function capitalizeFirstLetter(string) {
	return string[0].toUpperCase() + string.slice(1);
}


/*
	Functions
*/
const logSystem = function(data, command, args) {
	// Log exit
	args = args.join(" ");
	if (data.error || data.status) {
		commandInstance.log(`Failed to run command: \`${command} ${args}\``);
	} else {
		commandInstance.log(`Successfully ran command: \`${command} ${args}\``);
	}

	// Log results
	for (let output of [data.stderr, data.stdout]) {
		// Stringify buffers to be readable from console
		if (Buffer.isBuffer(output)) {
			output = output.toString();
		}
		// Remove extra \n's
		output = output.replace(/\n/, "");
		// Don't log empty output
		if (output.length === 0) {
			continue;
		}

		// Quote indented results
		commandInstance.log(output.replace(/^/, "    "));
	}
};

const addPrompts = function(object) {
	let prompts = [];
	for (const key in object) {
		const item = object[key];
		if (key === "template" || options[key]) {
			// Skip template mode since and pre-set options
			continue;
		} else if (!item.flag) {
			// Skip objects with more arguments, recursive
			const recurPrompts = addPrompts(item);
			for (const prompt of recurPrompts) {
				prompts.push(prompt);
			}
			continue;
		}
		let promptObject = {};

		promptObject.name = key;
		promptObject.message = capitalizeFirstLetter(item.description) + ": ";
		promptObject.default = item.default;
		if (item.choices) {
			promptObject.type = "list";
			promptObject.choices = item.choices;
		}

		prompts.push(promptObject);
	}

	return prompts;
};

const createConfigs = function() {
	for (const domain of options.domains) {
		// Data object
		let object;

		if (options.template) {
			object = {
				"template": options.template
			};
		} else {
			// Interactive or flags use a constructor
			object = {
				"directives": {
				}
			};
			for (const key in options) {
				let value = options[key];

				if (createArguments.constructorArguments[key]) {
					// Add non-directive values
					object[key] = value;
				} else if (createArguments.constructorArguments.directives[key] && value !== "false") { // skip undefined, false, "false", etc
					// Add directives
					let directiveName = createArguments.constructorArguments.directives[key].directive; // => "SSLEngine" rather than `arg` which => "ssl-engine"
					object.directives[directiveName] = value;
				}
			}
		}

		// Creation
		const config = new core.Config(domain, object);
		try {
			commandInstance.log("Saved to: " + config.save(options.output));
		} catch (error) {
			throw new Error(`Failed saving to: ${options.output}\n${error}`);
		}

		// Optional System Helpers - a2ensite and mkdirp (service apache2 reload is at the end of createConfigs())
		if (options["make-directories"] === true || options["make-directories"] === "true") {
			// Making directories leading up to `folder` for each directive value
			const makeDirectories = function(folder) {
				if (folder !== "false") { // skip "false" (defaults)
					// Replace {domain}
					folder = core.Config.replace(folder, config.replacements);
					try {
						core.mkdir(folder) ? commandInstance.log("Made directory: " + folder) : commandInstance.log("Skipped existing directory: " + folder);
					} catch (error) {
						throw new Error(`Failed to make directory: ${folder}\n${error}`);
					}
				}
			};

			const args = ["document-root", "error-log", "transfer-log"];
			const argsWithFile = ["error-log", "transfer-log"];
			for (const arg of args) {
				// Get path, remove file from path if it's a log file
				const folder = argsWithFile.includes(arg) ? options[arg].replace(/\/[^/]+$/, "/") : options[arg];
				makeDirectories(folder);
			}
		}
		if (options.enable === true || options.enable === "true") {
			logSystem(...config.enable());
		}
	}

	// Reload Apache2
	if (options.reload === true || options.reload === "true") {
		logSystem(...core.reload());
	}
};

const create = function(args) {
	commandInstance = this;
	const template = args.options.template;

	// Assign options to the internal options
	// TODO: workaround `create -irem domain.com` resulting in the domain going to -m, vorpal's fault?
	Object.assign(options, args.options);
	// Also assign domains
	if (args.domain) {
		options.domains = args.domain;
	}

	// Get constructor arguments to exit before conflicting with template mode
	const areConstructorArguments = Object.keys(options).some(value => createArguments.constructorArguments[value] || createArguments.constructorArguments.directives[value]);

	// Mode switching
	if (template) {
		// Mode is template
		if (areConstructorArguments) {
			// Throw when the mode is template and constructor arguments exist
			throw new Error("Template mode was set but constructor arguments were used!");
		} else if (!options.domains) {
			// Throw when template was set but no domains were set
			throw new Error("No domains were set!");
		} else {
			// Defaults
			if (options.template === true) {
				// Default when set but no template path given (vorpal would default it to true)
				options.template = createArguments.modes.template.default;
			}
			if (!options.output || options.output === true) {
				// Default when no output path given
				options.output = createArguments.output.default;
			}

			// No conflicts with other arguments, run template mode
			createConfigs();
		}
	} else {
		// Mode is interactive by default
		// Help text
		commandInstance.log(chalk.cyan("Welcome to interactive mode! This will walk you through some common settings. If you find this isn't advanced enough for you, try template mode! Some helpful information for you: false indicates the directive won't be set, the parentheses include helpful defaults you can use by not entering anything, and you can use {domain} to have your domain replace automatically.\n"));

		// Add prompts to `prompts`
		let prompts = addPrompts(createArguments);
		if (!options.domains) {
			// Add domains prompt to front of array
			prompts.unshift({
				"name": "domains",
				"message": "Domains to use (separated by spaces): ",
				validate(text) {
					// Make sure they've entered text, actual domain validation is prove to error and silly in this case
					return !!text;
				}
			});
		}

		// Prompt user
		commandInstance.prompt(prompts, (answers) => {
			// Add answers options
			options = Object.assign(options, answers);
			// Split domains to match as if it came in via vorpal
			if (typeof options.domains === "string") {
				options.domains = options.domains.split(" ");
			}

			// Create configs, enable them, make folders, etc
			createConfigs();
		});
	}
};


/*
	Vorpal Configuration Including Arguments
*/
/*
	Vorpal create/add/make
*/
const createCommand = (vorpal
	.command("create [domain...]", "create config files for domains")
	.alias("add")
	.alias("make")
	.action(create)
);
// Add options to create command
(function addOptions(object) {
	for (const key in object) {
		let item = object[key];

		if (item.flag) {
			createCommand.option(item.flag, item.description, item.autocomplete);
		} else {
			// Not actually an argument but instead more options
			addOptions(item);
		}
	}
})(createArguments);

// Run Vorpal
(vorpal
	.delimiter("a2vhsite:")
	.show()
	.parse(process.argv)
);

// Command History
vorpal.history("a2vhsite");

// Help text - The freaking weirdest hack to display my own text on help. No events, function replacement, extension of the API, etc works and this silly command works even though I'm not sure why it exists. Only displays on invalid command, not a2vhsite help or any other command help.
// TODO: make sure it doesn't exit when using this. Vorpal's fault?
(vorpal
	.catch("[words...]', 'Catches incorrect commands")
	.action(function(args) {
		const command = args.words.join(" ");
		this.log(chalk.cyan("Decrease frustration with server management, use an interactive walkthrough of common directives; a template for advanced configurations; or command line arguments to control your Apache2 VirtualHost .conf files! Learn more about the individual directives here: " + chalk.blue("https://httpd.apache.org/docs/current/vhosts/") + " and here: " + chalk.blue("https://httpd.apache.org/docs/2.4/mod/core.html")));
		this.log(vorpal._commandHelp(command));
	})
);
