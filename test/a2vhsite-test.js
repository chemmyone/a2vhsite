/*
	Tests for the a2vhsite module

	Tested - functions that are tested fully or partially in this document - found in `describe()`
	Stubs - functions that return simple replies and replaces other function not part of the test - found in `stubs`
	Spies - functions that record how they where being called - found in `spies`
	Fakes - objects that have some working implementations - found in `fakes`
	Dummies - objects are passed around just to fill parameter lists - found in `dummies`
	Real - objects or functions from an original module where a mock would be identical - found in `real`
*/


/*
	Module dependencies
*/
// Get functions without module.exports, inject mocks, inspect/override variables
// - for all modules (compatible with proxyquire)
require("rewire-global").enable();
// Assertion library
const expect = require("chai").expect;
// Spies, stubs, and mocks
const sinon = require("sinon");
// Proxies require to override dependencies
const proxyquire = require("proxyquire");


describe("a2vhsite", function() {
	/*
		Object definitions
	*/
	const stubs = {};
	const spies = {};
	const fakes = {};
	// const dummies = {};
	const real = {};

	/*
		Hoisting
	*/
	let a2vhsite;

	before(function() {
		/*
			Proxyquire - stubs, spies, fakes, dummies
		*/
		stubs.vorpal = function() {
			const data = {};
			const returnThis = function() {
				return this;
			};

			for (const key of ["delimiter", "show", "parse", "history", "action", "alias", "catch", "command", "option", "log"]) {
				data[key] = returnThis;
			}

			return data;
		}; // allow the original to be called or required

		real.core = require("../lib/core.js");
		// Simpler to set spies outside of Config class and better to keep shorter assignments in one place
		spies["core.Config"] = sinon.spy();
		spies["core.Config.save"] = sinon.spy();
		spies["core.Config.enable"] = sinon.spy();
		spies["core.mkdir"] = sinon.spy();
		spies["core.reload"] = sinon.spy();
		stubs.core = {
			"Config": class {
				constructor(domain) {
					spies["core.Config"](...arguments);

					this.domain = domain;
					this.replacements = [{
						"regex": /\{domain\}/gi,
						"value": this.domain
					}];
					this.save = spies["core.Config.save"];
					this.enable = () => {
						spies["core.Config.enable"](...arguments);

						return [fakes.systemOutput, "a2ensite", [this.domain]];
					};
				}
				static replace() {
					real.core.Config.replace(...arguments); // force callThru
				}
			},
			"mkdir": spies["core.mkdir"],
			reload() {
				spies["core.reload"](...arguments);

				return [fakes.systemOutput, "service", ["apache2", "reload"]];
			},
			"@noCallThru": true // don't allow the original to be called or required
		};


		/*
			Proxyquire - module to test
		*/
		a2vhsite = proxyquire("../bin/a2vhsite.js", {
			"vorpal": stubs.vorpal,
			"../lib/core.js": stubs.core
		});


		/*
			Rewire - functions to test, variables to use
		*/
		a2vhsite.createArguments = a2vhsite.__get__("createArguments");
		a2vhsite.addPrompts = a2vhsite.__get__("addPrompts");
		a2vhsite.createConfigs = a2vhsite.__get__("createConfigs");


		/*
			Rewire - stubs, spies, fakes, dummies
		*/
		// Empty commandInstance
		a2vhsite.__set__("commandInstance", {
			log() {}
		});


		/*
			Fakes
		*/
		// System output from reload and enable commands
		fakes.systemOutput = {
			"pid": 123,
			"output": [this.stderr, this.stdout],
			"stdout": "Test stdout",
			"stderr": "Test stderr",
			"status": 0
		};
		// Set default options to be used with createConfigs
		fakes.domains = {
			"domains": ["example.com", "example.net"]
		};
		fakes.template = {
			"template": "./lib/template.conf"
		};
		// defaultOptions mutate and return {}, take from domains and default options from all of the possiblePrompts
		(() => {
			// Pre-set no options in advance
			a2vhsite.__set__("options", {});
			// Get default prompts
			const possiblePrompts = a2vhsite.addPrompts(a2vhsite.createArguments);

			// Use default prompts to set default options without manipulating data.js again (leave that to a2vhsite.addPrompts())
			fakes.defaultOptions = Object.assign({}, fakes.domains);
			for (const possiblePrompt of possiblePrompts) {
				// If it has choices, default is an index
				if (possiblePrompt.choices) {
					// Set to the correct value using an index removing separators beforehand
					let choicesNoSeparators = possiblePrompt.choices;
					for (let i = 0; i < choicesNoSeparators.length; i++) {
						const item = choicesNoSeparators[i];
						if (typeof item === "object" && item.type === "separator") {
							choicesNoSeparators.splice(i, 1); // remove separator
						}
					}
					// Set default to the default a2vhsite.addPrompts found
					Object.assign(fakes.defaultOptions, {
						[possiblePrompt.name]: choicesNoSeparators[possiblePrompt.default]
					});
				} else {
					// Set default to the default a2vhsite.addPrompts found
					Object.assign(fakes.defaultOptions, {
						[possiblePrompt.name]: possiblePrompt.default
					});
				}
			}
		})();
		// makeDirectoriesOptions mutate and return {}, take from defaultOptions, replace make-directories from last object
		fakes.makeDirectoriesOptions = Object.assign({}, fakes.defaultOptions, {
			"make-directories": "true" // should be able to use strings
		});
		// enableOptions mutate and return {}, take from defaultOptions, replace enable from last object
		fakes.enableOptions = Object.assign({}, fakes.defaultOptions, {
			"enable": "true" // should be able to use strings
		});
		// reloadOptions mutate and return {}, take from defaultOptions, replace reload from last object
		fakes.reloadOptions = Object.assign({}, fakes.defaultOptions, {
			"reload": "true" // should be able to use strings
		});
		// templateOptions mutate and return {output}, take from domains and template
		fakes.templateOptions = Object.assign({
			"output": "./test/"
		}, fakes.domains, fakes.template);
	});


	describe("addPrompts()", function() {
		let prompts;
		before("run", function() {
			prompts = a2vhsite.addPrompts(a2vhsite.createArguments);
		});

		context("when there is no options already set", function() {
			it("should have at least a name, message, and default for all prompts", function() {
				for (const prompt of prompts) {
					expect(
						prompt
					).to.be.an("object").that.includes.all.keys(
						["name", "message", "default"]
					);
				}
			});
		});

		context("when there is an option already set", function() {
			it("should not create unnecessary prompts", function() {
				for (const prompt of prompts) {
					a2vhsite.__set__("options", {
						[prompt.name]: prompt.default
					});
					const resultPrompts = a2vhsite.addPrompts(a2vhsite.createArguments);

					// Check all prompts (prompt.name, not keys)
					for (const resultPrompt of resultPrompts) {
						expect(
							resultPrompt.name
						).to.not.equal(
							prompt.name
						);
					}
				}
			});
		});
	});


	describe("createConfigs()", function() {
		beforeEach("reset spys", function() {
			spies["core.Config"].reset();
			spies["core.Config.save"].reset();
			spies["core.Config.enable"].reset();
			spies["core.reload"].reset();
			spies["core.mkdir"].reset();
		});

		context("when options are their defaults", function() {
			beforeEach("set options to default, create configs", function() {
				a2vhsite.__set__("options", fakes.defaultOptions);
				a2vhsite.createConfigs();
			});

			it("should pass the proper directives/options", function() {
				expect(
					spies["core.Config"].lastCall.args[1]
				).to.be.an("object").that.deep.equals({
					"directives": {
						"ServerAdmin": "admin@{domain}",
						"ServerName": "www.{domain}",
						"ServerAlias": "{domain}",
						"DocumentRoot": "/var/www/{domain}/public_html",
						"LogLevel": "error",
						"ErrorLog": "/var/www/{domain}/log/error.log"
					},
					"address": "*",
					"port": "80"
				});
			});
			it("should save the configs using core", function() {
				expect(
					spies["core.Config.save"].callCount
				).to.be.equal(
					fakes.enableOptions.domains.length // run for each domain
				);
			});
			it("should not enable the configs using core", function() {
				expect(
					spies["core.Config.enable"].called
				).to.be.false;
			});
			it("should not make directories using core", function() {
				expect(
					spies["core.mkdir"].called
				).to.be.false;
			});
			it("should not reload apache2 using core", function() {
				expect(
					spies["core.reload"].called
				).to.be.false;
			});
		});

		context("when using a template", function() {
			it("should pass the template", function() {
				// Set options to include only a template, output, and domains, create configs
				a2vhsite.__set__("options", fakes.templateOptions);
				a2vhsite.createConfigs();

				expect(
					spies["core.Config"].lastCall.args[1]
				).to.be.an("object").that.deep.equals(
					fakes.template
				);
			});
		});

		context("when enabling is on", function() {
			it("should enable the configs using core", function() {
				// Set options to their defaults, but enable enabling sites, create configs
				a2vhsite.__set__("options", fakes.enableOptions);
				a2vhsite.createConfigs();

				expect(
					spies["core.Config.enable"].callCount
				).to.be.equal(
					fakes.enableOptions.domains.length // run for each domain
				);
			});
		});

		context("when make directories is on", function() {
			it("should make directories using core", function() {
				// Set options to their defaults, but enable making directories, create configs
				a2vhsite.__set__("options", fakes.makeDirectoriesOptions);
				a2vhsite.createConfigs();

				expect(
					spies["core.mkdir"].callCount
				).to.be.equal(
					fakes.enableOptions.domains.length * 2 // run for each domain * each folder (2 by default)
				);
			});
		});

		context("when reloading is on", function() {
			it("should reload apache2 using core", function() {
				// Set options to their defaults, but enable reloading, create configs
				a2vhsite.__set__("options", fakes.reloadOptions);
				a2vhsite.createConfigs();

				expect(
					spies["core.reload"].calledOnce // only run once even with two domains
				).to.be.true;
			});
		});
	});
});
